<template>
    <v-card>
        <v-card-title>
            <span class="headline">{{ isnew ? "New User": user.firstName + " " + user.lastName }}</span>
            <v-chip
                v-if="!isnew"
                class="ma-4"
                x-small
                outlined
                :color="$parent.$parent.$parent.$parent.getColor(user.status)"
            >{{user.status}}</v-chip>
            <v-spacer></v-spacer>
            <UserActions 
                :user="user"
                :disabled="loading"
                :linksIn="linksIn"
                v-on:saving="loading=true"
                v-on:interrupt="loading=false"
                v-on:save="userActionEmittedSave"
            ></UserActions>
        </v-card-title>

        <v-tabs horizontal>
            <v-tab key="profile">Profile</v-tab>
            <v-tab key="apps">Apps</v-tab>
            <v-tab key="role">Roles</v-tab>
            <v-tab-item key="profile">
                <v-form v-model="valid" ref="form">
                    <v-card flat outlined class="pa-0" height="300">
                        <v-card-text>
                            <v-container>
                                <v-row>
                                    <v-col sm="12" md="12">
                                        <!-- :error-messages="duplicateFound" -->
                                        <v-text-field 
                                            v-model="user.email" 
                                            label="Email"
                                            :rules="emailRules"
                                            required
                                            :disabled="loading"
                                            v-on:keyup="validate_email_on_keyup"
                                        ></v-text-field>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col sm="12" md="6">
                                        <v-text-field 
                                            v-model="user.firstName" 
                                            label="First name"
                                            :rules="requiredRules"
                                            required
                                            :disabled="loading"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col sm="12" md="6">
                                        <v-text-field 
                                            v-model="user.lastName"
                                            label="Last Name"
                                            :rules="requiredRules"
                                            required
                                            :disabled="loading"
                                        ></v-text-field>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-card-text>
                    </v-card>
                </v-form>
            </v-tab-item>
            <v-tab-item key="apps">
                <AppAssignments 
                    :user="user"
                    :apps="apps"
                    :loading="loading"
                    scope="user"
                    :width="550"
                    :fluid="false"
                ></AppAssignments>
            </v-tab-item>
            <v-tab-item key="roles">
                <v-card flat outlined class="pa-0">
                    <v-card-text>
                        <v-checkbox 
                            label="Tenant Admin"
                            v-model="user.adminFlag"
                        >
                        </v-checkbox>
                    </v-card-text>
                </v-card>
            </v-tab-item>
        </v-tabs>
        <v-progress-linear height="2" indeterminate :active="loading"></v-progress-linear>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
                :disabled="!valid || !dupValidated || !mutated"
                color="primary" class="pr-4"
                @click="save"
            ><v-icon dark left>mdi-check</v-icon>Save</v-btn>
            <v-btn 
                class="pr-4"
                @click="close"
            ><v-icon dark left>mdi-minus</v-icon>Close</v-btn>
        </v-card-actions>                        
    </v-card>
</template>

<script>
import axios from "axios";
import AppAssignments from "@/components/AppAssignments";
import UserActions from '@/components/UserActions';

export default {
    name: 'user',
    data() {
        return {
            valid: false,
            emailRules: [
                v => !!v || "E-mail is required",
                v => /.+@.+/.test(v) || "E-mail must be valid"
            ],
            requiredRules: [
                v => !!v || 'First and Last names are required'
            ],
            apps: [],
            groups: [],
            linksIn: null,
            loading: false,
            typingDelayTimer: null,
            dupValidated: true,
            duplicateFound: null,
            copy: null
        }
    },
    components: {
        AppAssignments, 
        UserActions
    },
    props: {
        user: Object,
        isnew: Boolean
    },
    computed: {
        mutated() {
            return (JSON.stringify(this.copy) != JSON.stringify(this.user));
        }
    },
    async created() {
        this.makeCopy();

        this.loading = true;
        await this.loadApps();
        await this.getGroups();
        await this.markApps();
        this.markIsAdmin();
        this.loading = false;
    },
    watch: {
        user: {
            async handler() {
                this.makeCopy();

                this.loading = true;
                this.resetValidations();
                await this.getGroups();
                this.markIsAdmin();

                const self = this;
                setTimeout(async function() {
                    await self.markApps();
                    self.loading = false;
                }, 1);
            }
        }
    },
    methods: {
        makeCopy() {
            this.copy = JSON.parse(JSON.stringify(this.user));
        },
        resetValidations() {
            this.$refs.form.resetValidation();
            this.dupValidated = true;
            this.duplicateFound = null;
        },
        close() {
            this.$emit("close", this.user);
        },
        async save() {
            this.loading = true;
            try {
                let url = this.$config.api + '/api/v1/users';
                let payload = {
                    profile: {
                        firstName: this.user.firstName,
                        lastName: this.user.lastName,
                        login: this.user.email,
                        email: this.user.email,
                        default_tenant: this.$store.getters.activeTenant.name
                    }
                };
                if (this.user.id && this.user.id.length > 0) {
                    url += '/' + this.user.id;
                } else {
                    url += '?activate=false';
                    payload.groupIds = [this.user.groupId];
                }

                const token = this.$store.state.o4oToken;

                let res = null;
                if (!this.duplicateFound) {
                    res = await axios.post(url, payload, { headers: { Authorization: "Bearer " + token } });
                } else {
                    res = await axios.get(this.$config.api + `/api/v1/users/${this.user.email}`, { headers: { Authorization: "Bearer " + token } });
                    const r1 = await axios.put(
                        this.$config.api + `/api/v1/groups/${this.user.groupId}/users/${res.data.id}`,
                        {},
                        { headers: { Authorization: "Bearer " + token } });
                    
                }
                
                this.user.status = res.data.status;
                this.user.id = res.data.id;
                this.linksIn = res.data._links;

                if (this.user.adminFlag != this.copy.adminFlag) {
                    if (this.user.adminFlag) {
                        const accessToken = await this.$authn.getAccessToken();                     
                        const res = await axios.put(
                            this.$config.api + '/tenants/' + this.$store.getters.activeTenant.name + '/admins/' + this.user.id,
                            null,
                            { headers: { Authorization: "Bearer " + accessToken } }
                        );
                    }
                }

                this.makeCopy();
                this.$emit("save", this.user);
            } catch(e) {
                if (e.response.data.errorSummary == 'Api validation failed: login') {
                    this.duplicateFound = 'This email/username exists in another tenant';
                } else {
                    this.duplicateFound = e.response.data.errorSummary;
                }
            }
            this.loading = false;
        },
        async loadApps() {
            const accessToken = await this.$authn.getAccessToken();
            const res = await axios.get(
                this.$config.api + '/apps', 
                { headers: { Authorization: "Bearer " + accessToken } }
            );
            this.apps = res.data;
        },
        async getGroups() {
            if (!this.user || !this.user.id) {
                this.groups = [];
                return;
            }

            const token = this.$store.state.o4oToken;
            const res = await axios.get(
                this.$config.api + '/api/v1/users/' + this.user.id + '/groups',
                { headers: { Authorization: "Bearer " + token } }
            );
            this.groups = res.data;
        },
        markIsAdmin() {
            for (const grp of this.groups) {
                if (grp.profile.name.startsWith('ADMINS')) {
                    this.copy.adminFlag = true;
                    this.user.adminFlag = true;
                    return;
                }
            }
            this.copy.adminFlag = false;
            this.user.adminFlag = false;
        },
        async markApps() {
            if (!this.user || !this.user.id) {
                const self = this;
                setTimeout(function() {
                    self.apps.forEach(app=>{
                        app.on = false;
                    });
                    return;
                }, 900);
                return;
            }

            let assigned = [];
            for (const grp of this.groups) {
                const parts = grp.profile.name.split('_');
                if (parts[0] == 'APPUSERS')
                    assigned.push(parts[2]);
            }
            this.apps.forEach(app=>{
                app.on = assigned.includes(app.id) || app.settings.allUsers === true;
                app.allUsers = app.settings.allUsers;
            });
        },
        async validate_email_on_keyup() {
            this.duplicateFound = null;
            this.dupValidated = false;
            const token = this.$store.state.o4oToken;
            if (this.typingDelayTimer) {
                clearTimeout(this.typingDelayTimer);
            }
            const self = this;            
            this.typingDelayTimer = setTimeout(async function() {
                if (self.$config.enforceDomainCheck == "true") {
                    const unverified = self.user.email.split('@')[1];
                    let verified = false;
                    const verifiedDomains = self.$store.state.verifiedDomains;
                    verifiedDomains.forEach(tenant=>{
                        tenant.domains.forEach(domain=>{
                            if (unverified === domain.domain) verified = true;
                        });
                    });
                    if (!verified) {
                        self.duplicateFound = unverified + ' is unverified';
                        return;
                    }
                }
                try {
                    const res = await axios.get(
                        self.$config.api + '/api/v1/users/' + self.user.email,
                        { headers: { Authorization: "Bearer " + token } }
                    );
                    if (!self.user.id || self.user.id.length <=0 || res.data.id != self.user.id) {
                        self.duplicateFound = 'Another user with this username exists';
                        self.dupValidated = true;
                        self.user.firstName = res.data.firstName;
                        self.user.lastName = res.data.lastName;
                    } else {
                        self.duplicateFound = null;
                        self.dupValidated = true;
                    }
                } catch(e) {
                    self.dupValidated = true;
                    self.duplicateFound = null;
                }
            }, 700);
        },
        userActionEmittedSave() {
            this.loading=false;
            this.makeCopy();
            this.$emit('save', this.user);
        }
    }
};
</script>

<style scoped>
</style>