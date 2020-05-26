<style scoped>
.img {
    opacity: 0.35;
}
</style>

<template>
    <v-card flat outlined class="pa-0 mx-auto" :min-height="height ? height : 300">
        <v-overlay
            absolute
            :value="loadingApps || loading"
            class="d-flex align-center justify-center"
            >
            <v-progress-circular
                class="my-4" 
                indeterminate
                size="80"
                height="20"
                color="white"
            ></v-progress-circular>
        </v-overlay>
        <v-container fluid>
            <v-card class="mx-auto" :max-width="width" color="transparent" flat>
                <v-row dense>
                    <v-col 
                        v-for="app in apps" 
                        :key="app.id" 
                        xg="4" lg="4" md="x" sm="6" xs="12">
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on }">
                                <v-card 
                                    height="65" 
                                    hover 
                                    class="ma-1 blue-grey--text"
                                    :outlined="app.on"
                                    @click="activateDeactivate(app)"
                                    v-on="on"
                                    >
                                    <v-list-item two-line>
                                        <v-list-item-content>
                                            <v-list-item-title 
                                                :class="!app.on ? 'grey--text text--lighten-1' : 'primary--text'"
                                                v-text="app.name"
                                            ></v-list-item-title>
                                            <div v-if="!app.on" class="caption grey--text" v-text="inactive"></div>
                                        </v-list-item-content>
                                        <v-avatar>
                                            <v-img 
                                                :src="app.logo[0].href"
                                                :class="!app.on ? 'img' : ''"
                                                >
                                            </v-img>
                                        </v-avatar>
                                    </v-list-item>
                                </v-card>
                            </template>
                            <v-card flat color="transparent" class="mx-auto">
                                <div class="white--text caption">Click to {{app.on ? deactivate : activate}}</div>
                            </v-card>
                        </v-tooltip>
                    </v-col>
                </v-row>
            </v-card>
        </v-container>
    </v-card>
</template>

<script>
import axios from "axios";

export default {
    name: 'apps',
    data() {
        return {
            loadingApps: false
        }
    },
    computed: {
        activate() {
            return this.scope == 'tenant' ? 'activate' : 'assign'
        },
        deactivate() {
            return this.scope == 'tenant' ? 'deactivate' : 'unassign'
        },
        inactive() {
            return this.scope == 'tenant' ? 'inactive' : 'unassigned'
        }
    },
    props: {
        tenant: Object,
        user: Object,
        apps: Array,
        loading: Boolean,
        scope: String,
        fluid: Boolean,
        height: Number,
        width: Number
    },
    methods: {      
        async activateDeactivate(app) {
            this.loadingApps = true;
            let token = undefined;
            try {
                switch (this.scope) {
                    case 'tenant':
                        token = await this.$authn.getAccessToken();
                        if (app.on) {
                            const res = await axios.delete(
                                this.$config.api + '/tenants/' + this.tenant.name + '/apps/' + app.id,
                                { headers: { Authorization: "Bearer " + token } }
                            );
                            if (res.status == 204) app.on=!app.on;
                        } else {
                            const res = await axios.put(
                                this.$config.api + '/tenants/' + this.tenant.name + '/apps/' + app.id,
                                null,
                                { headers: { Authorization: "Bearer " + token } }
                            );
                            if (res.status == 200) app.on=!app.on;
                        }
                        break;
                    case 'user':
                        if (!this.user || !this.user.id || this.user.id.length <= 0) {
                            this.loadingApps = false;
                            return;
                        }

                        token = this.$store.state.o4oToken;
                        if (app.on) {
                            const res = await axios.delete(
                                this.$config.api + '/api/v1/groups/' + app.APPUSERS_groupId + '/users/' + this.user.id,
                                { headers: { Authorization: "Bearer " + token } }
                            );
                            if (res.status == 204) app.on=!app.on;
                        } else {
                            const res = await axios.put(
                                this.$config.api + '/api/v1/groups/' + app.APPUSERS_groupId + '/users/' + this.user.id,
                                null,
                                { headers: { Authorization: "Bearer " + token } }
                            );
                            if (res.status == 204) app.on=!app.on;
                        }
                }
            } catch (e) {
                console.log(e);
            }
            this.loadingApps = false;
        }    
    }
}
</script>