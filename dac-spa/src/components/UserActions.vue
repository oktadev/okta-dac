<template>
    <div>
        <v-menu 
            offset-y left 
            v-if="validActions.length>1 || icon"
            :open-on-hover="!icon"
            >
            <template v-slot:activator="{ on }">
                <div v-if="icon">
                    <v-progress-circular
                        v-if="loading || disabled"
                        indeterminate
                        color="white"
                    ></v-progress-circular>
                    <v-icon v-else
                        class="ml-2"
                        color="grey darken-1"
                        small
                        @click="clickToGetLinks()"
                        v-on="on"
                    >{{icon}}</v-icon>
                </div>
                <v-btn v-else
                    outlined
                    color="grey darken-3"
                    dark
                    v-on="on"
                    :disabled="loading || disabled"
                    >
                    Actions<v-icon size="18" class="ml-2">mdi-chevron-down</v-icon>
                </v-btn>
            </template>
            <v-list v-if="validActions.length>0">
                <v-list-item
                    v-for="(action, index) in validActions"
                    :key="index"
                    @click="executeAction(action)"
                >
                    <v-list-item-icon class="mr-1">
                        <v-icon size="16" :color="action.color">{{action.icon}}</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title class="overline" v-text="action.label"></v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>                    
        </v-menu>
        <div v-else>
            <template v-for="action in validActions">
                <v-btn
                    outlined
                    color="grey darken-3"
                    dark
                    @click="executeAction(action)"
                    :disabled="loading"
                    :key="action.type"
                    >
                    <v-icon 
                        :color="action.color"
                        size="16" 
                        class="mr-2"
                    >{{action.icon}}</v-icon>
                    {{action.label}}
                </v-btn>
            </template>
        </div>
        <v-dialog 
            v-model="dialog"
            max-width="600"
            >
            <Confirm
                v-on:close="dialog=false"
                v-on:ok="confirm"
                :action="action"
                >
            </Confirm>
        </v-dialog>
    </div>  
</template>

<script>
import axios from "axios";
import Confirm from "@/components/UserActionConfirm"

export default {
    name: 'userActions',
    data() {
        return {
            dialog: false,
            action: null,
            loading: false,
            loaded: false,
            links: [],
            actions: [
                {
                    type: 'activate', 
                    label: 'Activate',
                    icon: 'mdi-account-plus', 
                    color: 'green', 
                    activeOnly: false
                },
                {
                    type: 'resetPassword', 
                    label: 'Reset Password',
                    icon: 'mdi-lock-reset', 
                    color: 'green', 
                    activeOnly: true,
                    confirmation: {
                        prompt: "Are you sure you want to reset this user's password?",
                        desc: "A password reset link is sent to this user's email address; the password is not automatically reset. The password reset link will expire 1 hour after it is sent."
                    }

                },
                {
                    type: 'reactivate', 
                    label: 'Resend Activation Email',
                    icon: 'mdi-lock-reset', 
                    color: 'green',
                    params: {
                        sendEmail: true
                    },
                    activeOnly: false,
                    confirmation: {
                        prompt: 'Are you sure you want to resend the activation email?',
                        desc: "A link will be sent to this user’s email addresses. They will be activated after they click the link and select a password for their account. The link will expire 7 days after it is sent."
                    }
                },                
                {
                    type: 'suspend', 
                    label: 'Suspend',
                    icon: 'mdi-account-minus-outline', 
                    color: 'orange', 
                    activeOnly: false
                },
                {
                    type: 'unsuspend', 
                    label: 'Un-suspend',
                    icon: 'mdi-account-plus-outline', 
                    color: 'green', 
                    activeOnly: false
                },
                {
                    type: 'deactivate',
                    label: 'Deactivate',
                    icon: 'mdi-account-minus', 
                    color: 'red', 
                    activeOnly: false,
                    confirmation: {
                        prompt: 'Are you sure you want to deactivate this user?',
                        desc: "Important: Once deactivated, this person cannot sign-in to their applications. You can always reactivate this person's account at a later time, but they will have to reset their password."
                    }

                },
            ],            
        }
    },
    components: {
        Confirm
    },
    computed: {
        validActions() {
            let validActions = [];
            for(const property in this.links) {
                if (this.actions.map(action=>{return action.type}).includes(property)) {
                    const action = this.actions.filter(action=>{return action.type == property;})[0];
                    if (this.user.status=='ACTIVE' && action.activeOnly || !action.activeOnly) {
                        validActions.push(
                            Object.assign(
                                action, 
                                this.links[property]
                            )
                        );
                    }
                }
            }
            return validActions;
        }
    },    
    props: {
        user: Object,
        linksIn: Object,
        disabled: Boolean,
        icon: String
    },
    async created() {
        if (this.icon) return;

        this.loaded = false;
        await this.getLinks();
    }, 
    watch: {
        user: {
            async handler() {
                if (this.icon) return;
                this.links = [];
                await this.getLinks();
            }
        },
        linksIn: {
            handler() {
                this.links = this.linksIn;
            }
        }
    },    
    methods: {
        async clickToGetLinks() {
            if (this.loaded) return;

            this.getLinks();
            this.loaded = true;
        },
        async getLinks() {
            if (!this.user || !this.user.id) return;

            this.loading = true;
            const token = this.$store.state.o4oToken;
            const res = await axios.get(
                this.$config.api + '/api/v1/users/' + this.user.id,
                { headers: { Authorization: "Bearer " + token } }
            );
            this.links = res.data._links;
            this.loading = false;
        },
        async confirm(action){
            this.executeAction(action);
            this.dialog = false;
        },
        async executeAction(action) {
            if (action.confirmation) {
                if (!this.dialog) {
                    this.action = action;
                    this.dialog = true;
                    return;
                }
            }

            this.$emit("saving");
            const token = this.$store.state.o4oToken;
            this.loading = true;
            try {
                let req = {
                    method: action.method ? action.method : 'GET',
                    url: this.$config.api + '/api/v1' + action.href.split('/api/v1')[1],
                    data: null,
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                };
                if (action.params) {
                    req.params = action.params;
                }
                const res = await axios(req);
                if (res.status == 200) {
                    const user = await axios.get(
                        this.$config.api + '/api/v1/users/' + this.user.id, 
                        { headers: { Authorization: "Bearer " + token } }
                    );
                    this.links = user.data._links;
                    this.user.status = user.data.status;            
                }
                this.$emit("save");
            } catch(e) {
                this.$emit("interrupt");
            }
            this.loading = false;            
        }        
    }
}
</script>