<template>
    <v-card max-width="900" min-height="600" class="mx-auto my-4">
        <v-overlay absolute :value="loading"
            class="d-flex align-center justify-center"
            >
            <v-progress-circular
                indeterminate
                size="80"
                height="20"
                color="white"
            ></v-progress-circular>                            
        </v-overlay>

        <v-container fluid>
            <v-row dense>
                <v-col
                    v-for="app in apps"
                    :key="app.id" 
                    cols="6"
                    >
                    <v-card 
                        class="ma-2"
                        outlined
                        >
                        <v-overlay absolute :value="app.loading">
                            <v-progress-circular
                                indeterminate
                                size="80"
                                height="20"
                                color="white"
                            ></v-progress-circular>                            
                        </v-overlay>

                        <v-list-item three-line>
                            <v-list-item-title class="headline mb-1" v-text="app.name"></v-list-item-title>
                            <v-list-item-avatar
                                tile
                                >
                                <v-img 
                                    :src="app.logo"
                                    :aspect-ratio="1"
                                ></v-img>                                    
                            </v-list-item-avatar>                                
                        </v-list-item>
                        <v-card-text>
                            <div class="overline mb-4">Settings</div>
                            <v-checkbox
                                dense
                                label="Assign to All Users"
                                v-model="app.allUsers"
                                @mouseup="app.loading = true; assignOnKeyup(app);"
                            ></v-checkbox>   
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
import axios from "axios";

export default {
    name: 'tenant-apps',
    data() {
        return {
            loading: false,
            apps: [],
            message: null,
            typingDelayTimer: null,
            tenant: null
        }
    },
    async created() {
        this.init();
    },
    methods: {
        async init() {
            const claims = await this.$authn.getClaims();
            this.tenant = claims.tenants[0].split(':')[1];

            this.loading = true;
            try {
                const accessToken = await this.$authn.getAccessToken();
                const res = await axios.get(
                    this.$config.api + '/apps',
                    { headers: { Authorization: "Bearer " + accessToken } }
                );
                this.apps = res.data.filter((app) => { 
                        return app.name
                    }).map(app=>{
                    app.logo = app.logo[0].href;
                    app.loading = false;
                    app.allUsers = app.settings ? app.settings.allUsers : false;
                    return app;
                });
            } catch (e) {
                this.message = `There was a problem loading apps: ${e}`;
            }
            this.loading = false;
        },
        assignOnKeyup(app) {
            const self = this;
            if (this.typingDelayTimer) {
                clearTimeout(this.typingDelayTimer);
            }

            this.typingDelayTimer = setTimeout(
                async function() {
                    app.loading = true;
                    try {
                        const accessToken = await self.$auth.getAccessToken();
                        const res = await axios.put(
                            self.$config.api + '/tenants/' + self.tenant + '/apps/' + app.id,
                            { allUsers: app.allUsers ? 'true' : 'false' },
                            { headers: { Authorization: "Bearer " + accessToken } }
                        )
                    } catch (e) {
                        app.loading = false;
                    }
                    app.loading = false;
                }
                , 400
            )

        },
    }
}
</script>