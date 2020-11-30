<template>
    <v-card class="mx-auto" max-width="700" flat>
        <v-container fluid>
            <v-row dense>
                <v-col v-for="card in homeCards" :key="card.name" :cols="card.flex">
                    <v-card height="300" hover @click="route(card.route)">
                        <v-list-item three-line>
                            <v-list-item-content>
                                <v-list-item-title class="headline mb-1">
                                    {{ card.name }}
                                </v-list-item-title>
                                <v-list-item-subtitle>{{ card.subtitle }}</v-list-item-subtitle>
                            </v-list-item-content>
                            <v-icon size="80">mdi-{{ card.icon }}</v-icon>
                        </v-list-item>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
import AuthJS from "@okta/okta-auth-js";
import axios from 'axios';

export default {
    name: "home",
    data() {
        return {
            tenants: [],
            homeCards: [],
            noCards: [],
            suCards: [
                {
                    name: this.$t("tenants"),
                    subtitle: "",
                    icon: "account",
                    flex: 6,
                    route: "tenants"
                }
                // { name: "App Master", subtitle: "", icon: "cog", flex: 6, route: 'app-master'}
            ],
            tenantAdminCards: [
                {
                    name: this.$t("users"),
                    subtitle: "",
                    icon: "account",
                    flex: 6,
                    route: "users"
                },
                {
                    name: this.$t("settings"),
                    subtitle: "",
                    icon: "cog-outline",
                    flex: 6,
                    route: "settings"
                },
                {
                    name: this.$t("Apps"),
                    subtitle: "",
                    icon: "apps",
                    flex: 6,
                    route: "apps"
                }                
            ]
        };
    },
    async created() {
        await this.getIdpsFromToken();
        const accessToken = await this.$auth.getAccessToken();
        this.getVerifiedDomains(accessToken);
        await this.initO4o();
    },
    methods: {
        async getIdpsFromToken() {
            const oktaAuth = new AuthJS({ issuer: this.$config.oidc.issuer });
            const idToken = await oktaAuth.tokenManager.get('idToken');
            try {
                this.tenants = !idToken.claims.tenants
                    ? []
                    : idToken.claims.tenants.map(tenant=>{
                        const parts = tenant.split(':');
                        return {
                            id: parts[0],
                            name: parts[1],
                            domains: []
                        }
                    });
            } catch(e) {
                console.log(e);
            }
        },
        getVerifiedDomains(accessToken) {
            for (const tenant of this.tenants) {
                const url = this.$config.useWebfingerPlugin ?
                    this.$config.apiWebfinger + "/domains?idp=" + tenant.id :
                    this.$config.api + '/tenants/' + tenant.name + '/domains';
                axios.get(url, {
                    headers: { Authorization: "Bearer " + accessToken }
                }).then(res=>{
                    let domains = this.$config.useWebfingerPlugin ? 
                        res.data.map(domain => {
                            let update = domain;
                            update.verified = true;
                            return update;
                        }) :
                        res.data;
                    tenant.domains = domains;
                    this.$store.commit("setVerifiedDomains", tenant);
                }).catch(err=>{
                    console.log(err);
                });
            }
        },
        async initO4o() {
            const authJs = new AuthJS({
                issuer: this.$config.oidc.issuer.split("oauth2")[0],
                clientId: this.$config.oidc.client_id,
                redirectUri: this.$config.oidc.redirect_uri,
                pkce: true
            });
            const exists = await authJs.session.exists();
            if (exists) {
                try {
                    const res = await authJs.token.getWithoutPrompt({
                        scopes: [
                            "openid",
                            "okta.users.manage",
                            "okta.groups.manage"
                        ]
                    });
                    const accessToken = res.tokens.accessToken;
                    // vuex
                    this.$store.commit("setO4oToken", accessToken.accessToken);
                    this.$store.subscribe((mutation, state) => { console.log("Got mutation", mutation.type); });
                } catch (e) {
                    console.log(e);
                }
                if (this.$root.$children) {
                    if (this.$root.$children[0].superuserFlag) {
                        this.homeCards = this.suCards;
                    } else {
                        this.homeCards = this.tenantAdminCards;
                    }
                } else {
                    this.homeCards = this.noCards;
                }
            }
            else{
                //no o4o token available, hide functionality
                this.homeCards = this.homeCards = this.noCards;
                this.$emit('service-msg',this.$t("errors.unableToGetSession"))
            }
        },
        route(route) {
            const token = this.$store.state.o4oToken;
            if (!token || token.length <= 0) {
                window.location.href = "/" + route;
            } else {
                this.$router.push("/" + route);
            }
        }
    }
};
</script>
