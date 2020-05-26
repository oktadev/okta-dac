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

                        <div class="d-flex flex-no-wrap justify-space-between">
                            <div>
                                <div class="d-inline-flex ml-4">
                                    <v-checkbox
                                        dense
                                        v-model="app.profile.appFlag"
                                        @mouseup="app.loading = true; updateOnKeyup(app);"
                                        >
                                    </v-checkbox>
                                    <v-card-title class="headline" v-text="app.name"></v-card-title>
                                </div>
                            </div>
                            <v-avatar
                                class="ma-4"
                                size="40"
                                tile
                            >                    
                                <v-img 
                                    :src="app.profile.avatar"
                                    :aspect-ratio="1"
                                ></v-img>
                            </v-avatar>
                        </div>
                        <!-- <v-card-text>
                            <v-text-field
                                v-model="app.profile.imageUrl"
                                label="Image URL"
                                v-on:keyup="updateOnKeyup(app)"
                                >
                            </v-text-field>                    
                        </v-card-text> -->

                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
import axios from "axios";

export default {
    name: 'app-master',
    data() {
        return {
            loading: false,
            apps: [],
            message: null,
            typingDelayTimer: null
        }
    },
    async created() {
        this.init();
    },
    methods: {
        async init() {
            this.loading = true;
            try {
                const accessToken = await this.$authn.getAccessToken();
                const res = await axios.get(
                    this.$config.api + '/apps/all',
                    { headers: { Authorization: "Bearer " + accessToken } }
                );
                this.apps = res.data.filter((app) => { 
                        return app.name
                    }).map(app=>{
                    if (!app.profile) {
                        app.profile = {
                            appFlag: false,
                            avatar: app.logo[0].href
                        }
                    }
                    //console.log("app", app.profile)
                    app.loading = false;
                    return app;
                });
            } catch (e) {
                this.message = `There was a problem loading apps: ${e}`;
            }
            this.loading = false;
        },
        updateOnKeyup(app) {
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
                            self.$config.api + '/apps/' + app.id,
                            { profile: app.profile },
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