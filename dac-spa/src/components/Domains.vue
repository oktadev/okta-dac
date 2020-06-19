<template>
    <v-card outlined class="pa-2 mx-auto">
        <v-simple-table>
            <thead>
                <tr>
                    <th class="text-left" :colspan="$config.useWebfingerPlugin ? 1 : 2">Domain</th>
                    <th v-if="$config.useWebfingerPlugin" class="text-left" colspan="2">Created</th>
                </tr>
                <tr v-if="loading">
                    <td colspan="2">
                        <v-progress-linear indeterminate height="2"></v-progress-linear>
                    </td>
                </tr>
            </thead>
            <tbody class="blue-grey--text lighten-2">
                <tr v-for="domain in domains" :key="domain.domain">
                    <td v-if="!domain.new">
                        <div v-if="!domain.verified">
                            <a @click="resume(domain)">{{ domain.domain }}</a>
                        </div>
                        <div v-else class="d-inline-flex">
                            {{ domain.domain }}
                            <v-tooltip right>
                                <template v-slot:activator="{ on }">
                                    <v-icon
                                        class="ml-2"
                                        size="14"
                                        color="success"
                                        v-on="on"
                                    >mdi-check-circle</v-icon>
                                </template>
                                <v-card flat color="transparent" class="mx-auto">
                                    <div class="white--text caption">Verified</div>
                                </v-card>
                            </v-tooltip>
                        </div>
                    </td>
                    <td
                        v-if="!domain.new && $config.useWebfingerPlugin"
                    >{{ $utils.offsetDate(domain.created) }}</td>
                    <td v-if="!domain.new">
                        <v-progress-circular
                            v-if="domain.domain===deleting"
                            indeterminate
                            size="16"
                            width="2"
                        ></v-progress-circular>
                        <v-icon
                            v-else
                            class="d-flex justify-end"
                            size="16"
                            color="red"
                            @click="deleteDomain(domain)"
                            :disabled="deleting && deleting.length>0"
                        >mdi-close</v-icon>
                    </td>
                    <td v-else>
                        <div class="d-inline-flex">
                            <v-text-field
                                ref="input"
                                dense
                                hide-details="auto"
                                v-model="input"
                                :rules="domainNameRules"
                                :error-messages="duplicateDomainFound"
                                :disabled="saving"
                            ></v-text-field>
                            <div v-if="!saving">
                                <v-progress-circular
                                    v-if="validating"
                                    indeterminate
                                    size="16"
                                    width="2"
                                    class="mx-1 my-2"
                                    color="grey"
                                ></v-progress-circular>
                                <v-icon
                                    v-else
                                    :disabled="!input || input.length<=0 || duplicateDomainFound && duplicateDomainFound.length>0"
                                    class="mx-1 my-2"
                                    size="16"
                                    color="green"
                                    @click="commit"
                                >mdi-check</v-icon>
                                <v-icon
                                    class="mx-0 my-2"
                                    size="16"
                                    color="red"
                                    @click="removeNew"
                                >mdi-close</v-icon>
                            </div>
                            <v-progress-circular
                                v-else
                                indeterminate
                                size="16"
                                width="2"
                                class="mx-1 my-2"
                                color="grey"
                            ></v-progress-circular>
                        </div>
                    </td>
                </tr>
                <tr v-if="domains.length <= 0 || domains[domains.length-1].domain">
                    <div class="my-2 ml-1">
                        <v-btn @click="addNew" x-small text color="primary">
                            <v-icon size="14">mdi-plus</v-icon>New
                        </v-btn>
                    </div>
                </tr>
            </tbody>
        </v-simple-table>
        <v-dialog v-model="dialog" max-width="750px" persistent>
            <DomainVerification
                @close="dialog=false"
                @cancel="validationCancel"
                :newDomain="newDomain"
                :tenant="tenant"
            ></DomainVerification>
        </v-dialog>
    </v-card>
</template>

<script>
import axios from "axios";
import DomainVerification from "@/components/DomainVerification";

export default {
    name: "domains",
    data() {
        return {
            domains: [],
            saving: false,
            loading: false,
            input: undefined,
            newDomain: undefined,
            deleting: undefined,
            validating: false,
            typingDelayTimer: undefined,
            duplicateDomainFound: undefined,
            dialog: false,
            domainNameRules: [
                v => /(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$)/.test(v) || "Valid domain name, e.g. example.com"
            ]
        };
    },
    computed: {
        superuserFlag() {
            return this.scope === "SUPERUSER";
        }
    },
    props: {
        tenant: Object,
        scope: String
    },
    components: {
        DomainVerification
    },
    created() {
        this.listDomains();
    },
    watch: {
        tenant: "listDomains"
    },
    methods: {
        async listDomains() {
            this.input = undefined;
            this.domains = [];
            this.loading = true;
            if (!this.tenant.id) {
                this.loading = false;
                return;
            }
            try {
                const accessToken = await this.$auth.getAccessToken();

                if (this.superuserFlag) {
                    const url = this.$config.useWebfingerPlugin
                        ? this.$config.apiWebfinger + "/domains?idp=" + this.tenant.id
                        : this.$config.api +
                          "/tenants/" +
                          this.tenant.name +
                          "/domains";                        
                    const pre = await axios.get(url, {
                        headers: { Authorization: "Bearer " + accessToken }
                    });
                    this.domains = pre.data.map(domain => {
                        return {
                            domain: domain.domain,
                            created: domain.created,
                            verified: domain.verified,
                            new: false
                        };
                    });
                } else {
                    const verifiedDomains = this.$store.state.verifiedDomains;
                    verifiedDomains.forEach(t => {
                        if (t.id === this.tenant.id) {
                            this.domains = t.domains.map(domain => {
                                return {
                                    domain: domain.domain,
                                    created: domain.created,
                                    verified: domain.verified,
                                    verificationString:
                                        domain.dnsVerificationString,
                                    new: false
                                };
                            });
                        }
                    });
                }
                if (this.$config.useWebfingerPlugin) {
                    const url2 = this.$config.apiWebfinger + "/verifications?idp=" + this.tenant.id;
                    const res = await axios.get(url2, {
                        headers: { Authorization: "Bearer " + accessToken }
                    });
                    if (res.data.length > 0) {
                        res.data.forEach(verification => {
                            if (
                                this.domains.findIndex(domain => {
                                    return (
                                        domain.domain === verification.domain
                                    );
                                }) < 0
                            ) {
                                this.domains.push({
                                    domain: verification.domain,
                                    created: verification.created,
                                    verificationString:
                                        verification.dnsVerificationString,
                                    verified: false,
                                    new: false
                                });
                            }
                        });
                    }
                }
            } catch (e) {
                console.log(e);
            }
            this.loading = false;
        },
        addNew() {
            this.newDomain = {
                domain: undefined,
                tenant: undefined,
                idp: undefined,
                created: undefined,
                verified: false,
                new: true
            };
            this.domains.push(this.newDomain);
            if (this.superuserFlag) {
                this.validating = false;
                this.duplicateDomainFound = undefined;
                const self = this;
                this.$nextTick(() => {
                    setTimeout(() => {
                        self.$refs.input[0].focus();
                    }, 10);
                });
            } else {
                this.dialog = true;
            }
        },
        removeNew() {
            this.domains.pop();
            this.input = undefined;
        },
        async commit() {
            this.saving = true;
            const accessToken = await this.$auth.getAccessToken();
            try {
                let res = undefined;
                if (this.$config.useWebfingerPlugin) {
                    res = await axios.post(
                        this.$config.apiWebfinger + "/domains",
                        {
                            domain: this.input,
                            tenant: this.tenant.name,
                            idp: this.tenant.id
                        },
                        { headers: { Authorization: "Bearer " + accessToken } }
                    );
                } else {
                    res = await axios.post(
                        this.$config.api +
                            "/tenants/" +
                            this.tenant.name +
                            "/domains",
                        { domain: this.input, verified: true },
                        { headers: { Authorization: "Bearer " + accessToken } }
                    );
                }
                this.newDomain.domain = res.data.domain;
                this.newDomain.created = res.data.created;
                this.newDomain.new = false;
                this.newDomain.verified = true;
                this.input = undefined;
            } catch (e) {
                this.duplicateDomainFound = e.response.data.error
                    ? e.response.data.error
                    : "An unexpected error occurred. Please try again or contact your system administrator";
            }
            this.saving = false;
        },
        async deleteDomain(target) {
            this.saving = true;
            this.deleting = target.domain;
            try {
                const index = this.domains.findIndex(domain => {
                    return domain.domain === target.domain;
                });
                const accessToken = await this.$auth.getAccessToken();
                const url = this.$config.useWebfingerPlugin
                    ? this.$config.apiWebfinger +
                      (target.verified ? "/domains/" : "/verifications/") +
                      target.domain
                    : this.$config.api +
                      "/tenants/" +
                      this.tenant.name +
                      "/domains/" +
                      target.domain;
                const res = await axios.delete(url, {
                    headers: { Authorization: "Bearer " + accessToken }
                });
                this.domains.splice(index, 1);
            } catch (e) {
                console.log(e);
            }
            this.saving = false;
            this.deleting = undefined;
        },
        validate_domain_on_keyup(input) {
            this.duplicateDomainFound = undefined;
            if (this.typingDelayTimer) {
                clearTimeout(this.typingDelayTimer);
            }
            const self = this;
            this.typingDelayTimer = setTimeout(async function() {
                if (!input || input.length <= 0) return;

                self.validating = true;
                const accessToken = await self.$auth.getAccessToken();
                try {
                    const res = await axios.get(
                        self.$config.apiWebfinger + "/domains/" + input,
                        {
                            headers: { Authorization: "Bearer " + accessToken }
                        }
                    );
                    if (res.status == 200) {
                        self.duplicateDomainFound = "Duplicate domain";
                    }
                } catch (e) {
                    if (e.response.status == 404) {
                        self.duplicateDomainFound = undefined;
                    } else {
                        console.log(e);
                    }
                }
                self.validating = false;
            }, 300);
        },
        validationCancel() {
            this.domains.pop();
            this.dialog = false;
        },
        resume(domain) {
            (this.newDomain = domain), (this.dialog = true);
        }
    }
};
</script>