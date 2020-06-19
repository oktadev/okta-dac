<template>
    <v-card class="mx-auto">
        <v-stepper v-model="verificationStep">
            <v-stepper-header>
                <v-stepper-step :complete="verificationStep > 1" step="1">New Domain</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step :complete="verificationStep > 2" step="2">Verification</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step step="3">Complete</v-stepper-step>
            </v-stepper-header>

            <v-stepper-items>
                <v-stepper-content step="1">
                    <v-card class="mb-12" height="220px">
                        <v-card-title>{{stepText[0].title}}</v-card-title>
                        <v-card-text>{{stepText[0].content}}</v-card-text>
                        <v-container class="mx-auto py-0">
                            <v-row>
                                <v-col cols="6">
                                    <v-text-field
                                        ref="domainName"
                                        dense
                                        outlined
                                        v-model="domainName"
                                        v-on:keydown="validating=true"
                                        v-on:keyup="validate_domain_on_keyup(domainName)"
                                        :rules="domainNameRules"
                                        :error-messages="duplicateDomainFound"
                                    ></v-text-field>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-card>
                    <v-btn
                        color="primary"
                        @click="postVerification"
                        :disabled="!dupValidated"
                        class="mr-1"
                    >
                        <v-progress-circular v-if="waiting" size="16" width="1" indeterminate></v-progress-circular>
                        <v-icon v-else size="16" class="mr-1">mdi-greater-than</v-icon>Continue
                    </v-btn>
                    <v-btn text @click="cancel">Cancel</v-btn>
                </v-stepper-content>

                <v-stepper-content step="2">
                    <v-card class="mb-6" height="244px">
                        <v-card-title>{{stepText[1].title}}</v-card-title>
                        <v-card-text>{{stepText[1].content}}</v-card-text>

                        <v-simple-table class="mx-2 my-0 py-0" dense>
                            <thead>
                                <tr>
                                    <th
                                        class="text-left"
                                        v-for="label in headers"
                                        :key="label"
                                    >{{label}}</th>
                                </tr>
                            </thead>
                            <tbody class="blue-grey--text lighten-2">
                                <tr>
                                    <td class="pa-0 ma-0">
                                        <CopyToClipboard
                                            solo
                                            flat
                                            hideDetails
                                            :value="domainVerification"
                                        ></CopyToClipboard>
                                    </td>
                                    <td class="pa-0 ma-0" width="40">
                                        <CopyToClipboard
                                            solo
                                            flat
                                            hideDetails
                                            :value="'TXT'"
                                            disabled
                                        ></CopyToClipboard>
                                    </td>
                                    <td class="pa-0 ma-0">
                                        <CopyToClipboard
                                            solo
                                            flat
                                            hideDetails
                                            :value="newDomain.verificationString"
                                        ></CopyToClipboard>
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>

                        <v-card-text>After the TXT record has been saved and confirmed, click Verify. (You may have to keep re-trying untill successful as DNS propagation may take time)</v-card-text>
                    </v-card>
                    <v-btn color="success" @click="putVerification" class="mr-1">
                        <v-progress-circular v-if="waiting" size="16" width="1" indeterminate></v-progress-circular>
                        <v-icon v-else size="16" class="ml-0 mr-1">mdi-check</v-icon>Verify
                    </v-btn>
                    <v-btn text @click="close">Cancel</v-btn>
                </v-stepper-content>

                <v-stepper-content step="3">
                    <v-card class="mb-12" height="220px">
                        <div :class="duplicateDomainFound? 'red--text' : ''">
                            <v-card-title>{{stepText[2].title}}</v-card-title>
                            <v-card-text>{{stepText[2].content}}</v-card-text>
                        </div>
                    </v-card>

                    <v-btn color="primary" text @click="close">Close</v-btn>
                </v-stepper-content>
            </v-stepper-items>
        </v-stepper>
    </v-card>
</template>

<script>
import axios from "axios";
import CopyToClipboard from "@/components/CopyToClipboard";

export default {
    name: "domain-verification",
    data() {
        return {
            verificationStep: 1,
            domainName: undefined,
            headers: ["Name", "Type", "Value"],
            validating: false,
            duplicateDomainFound: undefined,
            typingDelayTimer: undefined,
            waiting: false,
            domainNameRules: [
                v => /(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$)/.test(v) || "Valid domain name, e.g. example.com"
            ]
        };
    },
    props: {
        newDomain: Object,
        tenant: Object
    },
    computed: {
        stepText() {
            return [
                {
                    title: "Enter Your Domain Name",
                    content:
                        "We need to verify that you own your domain name before adding it to the routing rule. Enter the fully qualified domain name which you own. For example, mycompany.com or example.mycompany.com."
                },
                {
                    title: "Verify Domain Name Ownership",
                    content:
                        "Add the following TXT record to the DNS configuration for " +
                        this.domainName
                },
                {
                    title: this.duplicateDomainFound ? "Duplicate Domain" : "Success!",
                    content: this.domainName + (this.duplicateDomainFound ? " is already taken." : " has been successfully added.")
                }
            ];
        },
        dupValidated() {
            if (this.validating) return false;
            else
                return (
                    this.domainName &&
                    this.domainName.length > 0 &&
                    !this.duplicateDomainFound
                );
        },
        domainVerification() {
            return this.$config.dnsVerificationPrefix + "." + this.domainName;
        }
    },
    components: {
        CopyToClipboard
    },
    created() {
        this.setup();
    },
    watch: {
        newDomain: "setup"
    },
    methods: {
        setup() {
            this.verificationStep =
                !this.newDomain.new && !this.newDomain.verified ? 2 : 1;
            this.domainName = this.newDomain.domain;
            this.validating = false;
            this.duplicateDomainFound = undefined;
            this.typingDelayTimer = undefined;
            this.waiting = false;
        },
        validate_domain_on_keyup(input) {
            this.duplicateDomainFound = undefined;
            if (this.typingDelayTimer) clearTimeout(this.typingDelayTimer);

            const self = this;
            this.typingDelayTimer = setTimeout(async function() {
                if (!input || input.length <= 0) return;
                // self.waiting = true;
                // const accessToken = await self.$auth.getAccessToken();
                // try {
                //     const res = await axios.get(
                //         self.$config.apiWebfinger + "/domains/" + input,
                //         { headers: { Authorization: "Bearer " + accessToken } }
                //     );
                //     if (res.status == 200)
                //         self.duplicateDomainFound = "Duplicate domain";
                // } catch (e) {
                //     if (e.response.status == 404) {
                //         self.duplicateDomainFound = undefined;
                //     } else console.log(e);
                // }
                // self.waiting = false;
                self.duplicateDomainFound = undefined;
                self.validating = false;
            }, 300);
        },
        async postVerification() {
            this.waiting = true;
            try {
                const accessToken = await this.$auth.getAccessToken();
                let res = undefined;
                if (this.$config.useWebfingerPlugin) {
                    res = await axios.post(
                        this.$config.apiWebfinger + "/verifications",
                        {
                            domain: this.domainName,
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
                        {
                            domain: this.domainName,
                            verified: false
                        },
                        { headers: { Authorization: "Bearer " + accessToken } }
                    );
                }
                this.newDomain.verificationString =
                    res.data.dnsVerificationString;
                this.newDomain.domain = res.data.domain;
                this.newDomain.created = res.data.created;
                this.newDomain.new = false;
                // this.newDomain.tenant = res.data.tenant;
                // this.newDomain.idp = res.data.idp;

                this.verificationStep = 2;
            } catch (e) {
                this.duplicateDomainFound = this.dupErrorMessage(e);
            }
            this.waiting = false;
        },
        dupErrorMessage(e) {
            return e.response.data.error ?
                e.response.data.error :
                "An unexpected error occurred. Please try again or contact your system administrator";
        },
        async putVerification() {
            this.waiting = true;
            try {
                const accessToken = await this.$auth.getAccessToken();
                const url = this.$config.useWebfingerPlugin ? 
                    this.$config.apiWebfinger + "/verifications/" + this.domainName :
                    this.$config.api + "/tenants/" + this.tenant.name + '/domains/' + this.domainName;
                const res = await axios.put(url, {
                    domain: this.domainName,
                    tenant: this.tenant.name,
                    idp: this.tenant.id,
                    dnsVerificationString: this.newDomain.verificationString
                }, { headers: { Authorization: "Bearer " + accessToken } 
                });
                if (res.data.verified) {
                    const verifiedDomains = this.$store.state.verifiedDomains;
                    verifiedDomains.forEach(t => {
                        if (t.id === this.tenant.id) {
                            let updatedDomains = t.domains;
                            updatedDomains.push({
                                verified: true,
                                domain: res.data.domain,
                                created: res.data.created
                            });
                            const tenant = {
                                id: this.tenant.id,
                                name: this.tenant.name,
                                domains: updatedDomains
                            };
                            this.$store.commit("setVerifiedDomains", tenant);
                        }
                    });
                    this.newDomain.domain = res.data.domain;
                    this.newDomain.created = res.data.created;
                    this.newDomain.new = false;
                    this.newDomain.verified = true;
                    // this.newDomain.tenant = res.data.tenant;
                    // this.newDomain.idp = res.data.idp;

                    this.verificationStep = 3;
                }
            } catch (e) {
                console.log(e);
                this.newDomain.domain = undefined;
                this.newDomain.created = undefined;
                this.newDomain.new = true;
                this.duplicateDomainFound = this.dupErrorMessage(e);
                this.verificationStep = 3;
            }
            this.waiting = false;
        },
        cancel() {
            this.$emit("cancel");
        },
        close() {
            this.$emit("close");
        }
    }
};
</script>