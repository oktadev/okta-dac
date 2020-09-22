<template>
    <v-card class="mx-auto">
        <v-card-title v-text="title"></v-card-title>
        <v-progress-linear :active="saving" indeterminate height="2"></v-progress-linear>
        <v-form ref="form" v-model="valid">
            <v-container class="mx-auto">
                <v-row v-if="!readonly">
                    <v-col>
                        <v-text-field
                            class="px-0"
                            required
                            :outlined="!readonly"
                            :filled="!readonly"
                            :label="$t('tenant')"
                            v-model="tenant.name"
                            :rules="nameRules"
                            :error-messages="duplicateFound"
                            :disabled="readonly || saving"
                            :hint="hint"
                            v-on:keyup="validate_subdomain_on_keyup"
                        ></v-text-field>
                    </v-col>
                </v-row>

                <v-card v-if="!readonly" outlined>
                    <div class="overline pt-2 pl-2">Admin</div>
                    <v-row>
                        <v-col>
                            <v-text-field
                                class="px-2"
                                required
                                label="Email"
                                v-model="tenant.adminEmail"
                                :rules="emailRules"
                                :error-messages="duplicateEmailFound"
                                :disabled="saving"
                                v-on:keyup="validate_email_on_keyup"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row class="mt-n4">
                        <v-col>
                            <v-text-field
                                class="px-2"
                                required
                                :rules="requiredRules"
                                label="First Name"
                                v-model="tenant.adminFN"
                                :disabled="saving"
                            ></v-text-field>
                        </v-col>
                        <v-col>
                            <v-text-field
                                class="px-2"
                                required
                                :rules="requiredRules"
                                label="Last Name"
                                v-model="tenant.adminLN"
                                :disabled="saving"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                </v-card>

                <v-tabs horizontal v-if="tenant.id">
                    <v-tab key="admins">Admins</v-tab>
                    <v-tab key="apps">Apps</v-tab>
                    <v-tab key="domains">Domains</v-tab>
                    <v-tab-item key="admins">
                        <v-card outlined class="pa-2">
                            <v-simple-table>
                                <template v-slot:default>
                                    <thead>
                                        <tr>
                                            <th class="text-left">Email</th>
                                            <th class="text-left">Created</th>
                                        </tr>
                                        <tr v-if="loadingAdmins">
                                            <td colspan="2">
                                                <v-progress-linear indeterminate height="2"></v-progress-linear>
                                            </td>
                                        </tr>
                                    </thead>
                                    <tbody class="blue-grey--text lighten-2">
                                        <tr v-for="admin in tenantAdmins" :key="admin.id">
                                            <td>{{ admin.profile.email }}</td>
                                            <td>{{ $utils.offsetDate(admin.created) }}</td>
                                        </tr>
                                    </tbody>
                                </template>
                            </v-simple-table>
                        </v-card>
                    </v-tab-item>
                    <v-tab-item key="apps">
                        <AppAssignments
                            :tenant="tenant"
                            :apps="apps"
                            :loading="loadingApps"
                            scope="tenant"
                        ></AppAssignments>
                    </v-tab-item>
                    <v-tab-item key="domains">
                        <Domains
                            :tenant="tenant"
                            scope="SUPERUSER"
                        ></Domains>
                    </v-tab-item>
                </v-tabs>
            </v-container>
        </v-form>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
                text
                color="primary"
                v-on:click="save"
                :disabled="!valid || !dupValidated || !dupEmailValidated"
                v-if="!readonly"
                >
                <v-icon dark left>mdi-check</v-icon>Save
            </v-btn>
            <v-btn text v-on:click="close">
                <v-icon dark left>mdi-minus</v-icon>Close
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import axios from "axios";
import AppAssignments from "@/components/AppAssignments";
import Domains from "@/components/Domains";

export default {
    name: "tenant",
    data() {
        return {
            valid: true,
            nameRules: [
                v => !!v || "Tenant name is required",
                v => RegExp("^.*(?<!-)$").test(v) || "Should not end with '-'",
                v => RegExp("^[a-z0-9-]+(?<!-)$").test(v) || this.hint
            ],
            emailRules: [
                v => !!v || "E-mail is required",
                v => /.+@.+/.test(v) || "E-mail must be valid"
            ],
            requiredRules: [v => !!v || "First and Last names are required"],
            hint: "Lower case letters, numbers and '-' only",
            saving: false,
            tenantAdmins: [],
            loadingAdmins: false,
            availableApps: [],
            apps: [],
            loadingApps: false,
            typingDelayTimer1: null,
            duplicateFound: null,
            dupValidated: false,
            typingDelayTimer2: null,
            duplicateEmailFound: null,
            dupEmailValidated: false,
            existingAdminId: null,
            o4oToken: null
        };
    },
    components: {
        AppAssignments, Domains
    },
    computed: {
        title() {
            return this.tenant.name != "" ? this.tenant.name : "New";
        }
    },
    async updated() {
        if (this.tenant.name == "") {
            this.$refs.form.resetValidation();
            this.typingDelayTimer1 = null;
            this.duplicateFound = null;
            this.dupValidated = false;
            this.typingDelayTimer2 = null;
            this.duplicateEmailFound = null;
            this.dupEmailValidated = false;
        }
    },
    created() {
        this.getTenantInfo();
    },
    watch: {
        tenant: "getTenantInfo"
    },
    props: {
        tenant: Object,
        readonly: Boolean
    },
    methods: {
        async save() {
            try {
                this.saving = true;

                const accessToken = await this.$authn.getAccessToken();

                // Step 1: Create the Tenant
                const r1 = await axios.post(
                    this.$config.api + "/tenants",
                    {
                        name: this.tenant.name
                    },
                    { headers: { Authorization: "Bearer " + accessToken } }
                );

                // Step 2: Create the User in the Group associated with the Tenant
                // Check if the user exists
                let userId = this.existingAdminId;
                let userProfile = this.existingAdminProfile;

                if (!userId) {
                    const r2 = await axios.post(
                        this.$config.api + "/api/v1/users",
                        {
                            profile: {
                                firstName: this.tenant.adminFN,
                                lastName: this.tenant.adminLN,
                                email: this.tenant.adminEmail,
                                login: this.tenant.adminEmail,
                                default_tenant: this.tenant.name
                            },
                            groupIds: [r1.data.USERS_groupId]
                        },
                        { headers: { Authorization: "Bearer " + this.o4oToken } }
                    );
                    userId = r2.data.id;
                    userProfile = r2.data.profile;
                } else {
                    const r3 = await axios.put(
                        this.$config.api + `/api/v1/groups/${r1.data.USERS_groupId}/users/${userId}`,
                        {},
                        { headers: { Authorization: "Bearer " + this.o4oToken } }
                    )
                }

                // Step 3: Make the user an admin of the tenant
                const r3 = await axios.put(
                    this.$config.api +
                        "/tenants/" +
                        this.tenant.name +
                        "/admins/" +
                        userId,
                    null,
                    { headers: { Authorization: "Bearer " + accessToken } }
                );
                this.tenant.created = r1.data.created;
                this.tenant.id = r1.data.id;
                this.tenantAdmins = [
                    {
                        profile: userProfile,
                        created: r3.data.lastUpdated
                    }
                ];

                this.saving = false;
                this.$emit("close");
            } catch (e) {
                console.log("error",e);
                console.log("error creating tenant", JSON.stringify(e));
                this.saving = false;
            }
        },
        close() {
            this.$emit("close");
        },
        resetApps() {
            this.apps.forEach(a => {
                a.on = false;
            });
        },
        async listAdmins() {
            this.tenantAdmins = [];
            this.loadingAdmins = true;
            if (!this.tenant.id) {
                this.loadingAdmins = false;
                return;
            }

            const accessToken = await this.$authn.getAccessToken();
            const res = await axios.get(
                this.$config.api + "/tenants/" + this.tenant.name + "/admins",
                {
                    headers: { Authorization: "Bearer " + accessToken }
                }
            );
            this.tenantAdmins = res.data;
            this.loadingAdmins = false;
        },
        async listApps() {
            this.resetApps();
            this.loadingApps = true;
            const accessToken = await this.$authn.getAccessToken();
            if (this.availableApps.length == 0) {
                const pre = await axios.get(this.$config.api + "/apps", {
                    headers: { Authorization: "Bearer " + accessToken }
                });
                this.availableApps = pre.data;
            }
            let active = [];
            if (this.tenant.name && this.tenant.name.length > 0) {
                const res = await axios.get(
                    this.$config.api + "/tenants/" + this.tenant.name + "/apps",
                    { headers: { Authorization: "Bearer " + accessToken } }
                );
                active = res.data.map(app => {
                    return app.id;
                });
            }
            this.apps = this.availableApps.map(app => {
                app.on = active.includes(app.id);
                return app;
            });
            this.loadingApps = false;
        },      
        getTenantInfo() {
            this.listAdmins();
            this.listApps();
            this.o4oToken = this.$store.state.o4oToken;
        },
        validate_subdomain_on_keyup() {
            this.duplicateFound = null;
            this.dupValidated = false;
            if (this.typingDelayTimer1) {
                clearTimeout(this.typingDelayTimer1);
            }
            const self = this;
            this.typingDelayTimer1 = setTimeout(async function() {
                if (!self.tenant.name || self.tenant.name.length <= 0) return;
                const accessToken = await self.$auth.getAccessToken();
                try {
                    const res = await axios.get(
                        self.$config.api + "/tenants/" + self.tenant.name,
                        { headers: { Authorization: "Bearer " + accessToken } }
                    );
                    if (res.status == 200)
                        self.duplicateFound = "Tenant name already taken";
                } catch (e) {
                    self.dupValidated = true;
                }
            }, 700);
        },
        validate_email_on_keyup() {
            this.duplicateEmailFound = null;
            this.dupEmailValidated = false;
            if (this.typingDelayTimer2) {
                clearTimeout(this.typingDelayTimer2);
            }
            const self = this;
            this.typingDelayTimer2 = setTimeout(async function() {
                if (
                    !self.tenant.adminEmail ||
                    self.tenant.adminEmail.length <= 0
                )
                    return;
                const accessToken = await self.$auth.getAccessToken();
                try {
                    const res = await axios.get(
                        self.$config.api + "/api/v1/users/" + self.tenant.adminEmail,
                        { headers: { Authorization: "Bearer " + self.o4oToken } }
                    );
                    if (res.status == 200) {
                        //self.duplicateEmailFound = "Email already exists. ";
                        self.dupEmailValidated = true;
                        // console.log("user", JSON.stringify(res.data));
                        self.existingAdminId = res.data.id;
                        self.existingAdminProfile = res.data.profile;
                    } else {
                        console.log("Status code: " + res.status);
                        self.dupEmailValidated = true;
                        self.existingAdminId = null;
                        self.existingAdminProfile = null;
                    }
                    // console.log("existingAdminId", self.existingAdminId);
                } catch (e) {
                    self.dupEmailValidated = true;
                }
            }, 700);
        }      
    }
};
</script>
