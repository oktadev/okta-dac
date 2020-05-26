<style scoped>
</style>

<template>
    <v-form ref="form" v-model="valid" lazy-validation>
        <v-alert class="mt-1" :type="alertType" dense text dismissible v-model="alert">{{alertMessage}}</v-alert>
        <v-container class="mx-auto py-0">
            <v-row no-gutters>
                <v-col lg="12" md="12" sm="12">
                    <v-tabs horizontal>
                        <v-tab key="general">SAML</v-tab>
                        <v-tab key="settings">Settings</v-tab>
                        <v-tab key="jit">JIT</v-tab>
                        <v-tab-item key="general" class="py-2">
                            <v-card
                                v-if="!ready"
                                flat
                                :height="heightGeneral"
                                class="d-flex align-center justify-center grey lighten-1"
                            >
                                <v-progress-circular
                                    size="80"
                                    height="20"
                                    color="white"
                                    indeterminate
                                />
                            </v-card>
                            <v-card flat class="pa-2" :height="heightGeneral" v-if="ready" outlined>
                                <Field text
                                    v-model="idp.protocol.credentials.trust.issuer"
                                    :field="fields.idpIssuerUri"
                                    :saving="saving"
                                ></Field>
                                <Field text
                                    v-model="idp.protocol.endpoints.sso.url"
                                    :field="fields.idpSsoUrl"
                                    :saving="saving"
                                ></Field>
                                <v-file-input
                                    v-if="!certObj"
                                    accept=".DER, .PEM, .CRT, .CER"
                                    :label="fields.idpSignatureCert.label"
                                    v-on:change="uploadCert($event)"
                                    :error-messages="message"
                                    :disabled="saving"
                                    :loading="processingCert"
                                >
                                    <template v-slot:append-outer>
                                        <FieldHelp :text="fields.idpSignatureCert.help"></FieldHelp>
                                    </template>
                                </v-file-input>
                                <v-textarea
                                    class="caption font-weight-light mt-2 mb-n4"
                                    v-if="certObj"
                                    :value="certData"
                                    :label="fields.idpSignatureCert.label"
                                    readonly
                                    outlined
                                    filled
                                    dense
                                    auto-grow
                                    clearable
                                    v-on:click:clear="clearCert"
                                    :disabled="saving"
                                >
                                    <template v-slot:append-outer>
                                        <FieldHelp :text="fields.idpSignatureCert.help"></FieldHelp>
                                    </template>
                                </v-textarea>
                                <CopyToClipboard
                                    :value="idp._links.acs.href"
                                    label="ACS"
                                    :pr="'6'"
                                    outlined filled
                                ></CopyToClipboard>
                                <CopyToClipboard
                                    :value="idp.protocol.credentials.trust.audience"
                                    label="Audience URI"
                                    :pr="'6'"
                                    outlined filled
                                ></CopyToClipboard>
                                <v-btn
                                    small
                                    text
                                    color="primary"
                                    class="ml-n3"
                                    @click="showAdvanced"
                                >{{advancedButton}}</v-btn>
                                <div v-if="advanced" class="grey lighten-4 pa-2">
                                    <Field select
                                        v-model="idp.protocol.endpoints.sso.binding"
                                        :field="fields.requestBinding"
                                        :saving="saving"
                                    ></Field>
                                    <Field checkbox
                                        v-model="checkboxSignAssertion"
                                        :field="fields.requestSignature"
                                        :saving="saving"
                                    ></Field>
                                    <Field select
                                        v-if="checkboxSignAssertion"
                                        v-model="idp.protocol.algorithms.request.signature.algorithm"
                                        :field="fields.requestSignatureAlgorithm"
                                        :saving="saving"
                                    ></Field>
                                    <Field select
                                        v-model="idp.protocol.algorithms.response.signature.scope"
                                        :field="fields.responseSignatureVerification"
                                        :saving="saving"
                                    ></Field>
                                    <Field select
                                        v-model="idp.protocol.algorithms.response.signature.algorithm"
                                        :field="fields.responseSignatureAlgorithm"
                                        :saving="saving"
                                    ></Field>
                                    <Field text
                                        v-model="idp.protocol.endpoints.sso.destination"
                                        :field="fields.destination"
                                        :saving="saving"
                                    ></Field>
                                    <Field radio radiorow
                                        v-model="idp.protocol.endpoints.acs.type"
                                        :field="fields.acsUrl"
                                        :saving="saving"
                                    ></Field>                                    
                                    <v-row no-gutters class="pb-0">
                                        <v-col lg="5" sm="5" class="pr-2">
                                            <v-text-field
                                                required
                                                v-model="clockSkewValue"
                                                :label="fields.maxClockSkew.label"
                                                :disabled="saving"
                                                :rules="fields.maxClockSkew.rules"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col lg="7" sm="7">
                                            <Field select
                                                v-model="skewValueType"
                                                :field="fields.maxClockSkew"
                                                :saving="saving"
                                                nolabel
                                            ></Field>
                                        </v-col>
                                    </v-row>
                                </div>
                            </v-card>
                        </v-tab-item>
                        <v-tab-item key="settings" class="py-2">
                            <v-card flat class="pa-2" :height="baseHeight" outlined>
                                <div v-if="idp.policy">
                                    <Field select
                                        v-model="idp.policy.subject.userNameTemplate.template"
                                        :field="fields.idpUsername"
                                        :saving="saving"
                                        filled
                                    ></Field>
                                    <Field checkbox
                                        v-model="usernameRegexRequired"
                                        :field="fields.filter"
                                        :saving="saving"
                                    ></Field>
                                    <v-text-field
                                        v-if="usernameRegexRequired"
                                        class="d-flex mt-n6 pt-2 pr-8"
                                        v-model="idp.policy.subject.filter"
                                        :disabled="saving"
                                        filled
                                    ></v-text-field>
                                    <Field select
                                        v-model="idp.policy.subject.matchType"
                                        :field="fields.matchAgainst"
                                        :saving="saving"
                                        filled
                                    ></Field>
                                </div>
                            </v-card>
                        </v-tab-item>
                        <v-tab-item key="jit" class="py-2">
                            <v-card flat class="pa-2" :height="baseHeight" outlined>
                                <div v-if="idp.policy">
                                    <Field radio
                                        v-model="idp.policy.provisioning.action"
                                        :field="fields.jit"
                                        :saving="saving"
                                    ></Field>                                    
                                    <div v-if="idp.policy.provisioning.action=='AUTO'">
                                        <Field checkbox
                                            v-model="idp.policy.provisioning.profileMaster"
                                            :field="fields.profileMaster"
                                            :saving="saving"
                                        ></Field>
                                    </div>
                                </div>
                            </v-card>
                        </v-tab-item>
                    </v-tabs>
                </v-col>
            </v-row>
            <v-row no-gutters>
                <v-col cols="12" class="pr-0">
                    <v-progress-linear v-if="saving" indeterminate height="1"></v-progress-linear>
                </v-col>
            </v-row>
            <v-row no-gutters>
                <v-col cols="10" class="d-flex flex-row-reverse pt-4">
                    <v-btn x-small text class="" color="primary"
                        :disabled="!ready || !valid || saving"
                        @click="downloadMetadata"
                    >Download Metadata</v-btn>
                </v-col>
                <v-col cols="2" class="d-flex flex-row-reverse pt-2">
                    <v-btn
                        color="primary"
                        :disabled="!ready || !valid || saving"
                        @click="update"
                    >Update</v-btn>
                </v-col>
            </v-row>
        </v-container>
    </v-form>
</template>

<script>
import forge from "node-forge";
import axios from "axios";
import Field from "@/components/Field";
import FieldHelp from "@/components/FieldHelp";
import CopyToClipboard from "@/components/CopyToClipboard";
import FileSaver from 'file-saver';

export default {
    name: "Idp",
    components: {
        Field, FieldHelp, CopyToClipboard
    },
    data() {
        return {
            idp: false,
            valid: true,
            saving: false,
            processingCert: false,
            x5c: [],
            certObj: false,
            message: undefined,
            height: 0,
            baseHeight: 355,
            advancedButton: "Advanced Settings",
            ready: false,
            advanced: false,
            fields: {
                idpIssuerUri: {
                    label: "IdP Issuer URI",
                    help:
                        "Issuer URI of the Identity Provider. The value is usually the SAML Metadata EntityID of the IdP EntityDescriptor",
                    rules: [v => !!v || "IdP Issuer Uri is required"]
                },
                idpSsoUrl: {
                    label: "IdP Single Sign-On URL",
                    help:
                        "The binding-specific IdP Authentication Request Protocol endpoint that receives SAML AuthnRequest messages",
                    rules: [
                        v => !!v || "IdP Single Sign-On URL is required",
                        v => /http(s)?:\/\/.+/.test(v) || "Must be in URL format. e.g. http(s)//foo"
                    ]
                },
                idpSignatureCert: {
                    label: "IdP Signature Certificate",
                    help:
                        "The PEM or DER encoded public key certificate of the Identity Provider used to verify SAML message and assertion signatures"
                },
                requestBinding: {
                    label: "Request Binding",
                    help:
                        "The SAML Authentication Request Protocol binding used to send SAML AuthnRequest messages to the IdP",
                    select: [
                        { value: "HTTP-POST", text: "HTTP POST" },
                        { value: "HTTP-REDIRECT", text: "HTTP REDIRECT" }
                    ]
                },
                requestSignature: {
                    label: "Sign SAML Authentication Requests",
                    help: "Specifies whether to sign SAML AuthnRequest messages"
                },
                requestSignatureAlgorithm: {
                    label: "Request Signature Algorithm",
                    help:
                        "Specifies the signature algorithm used to sign SAML AuthnRequest messages sent to the IdP",
                    select: ["SHA-256", "SHA-1"]
                },
                responseSignatureVerification: {
                    label: "Response Signature Verification",
                    help:
                        "Specifies the required signatures when validating SAML assertions issued by the IdP",
                    select: [
                        { value: "ANY", text: "Response or Assertion" },
                        { value: "RESPONSE", text: "Response" },
                        { value: "TOKEN", text: "Assertion" }
                    ]
                },
                responseSignatureAlgorithm: {
                    label: "Response Signature Algorithm",
                    help:
                        "Specifies the minimum signature algorithm when validating SAML assertions issued by the IdP",
                    select: ["SHA-256", "SHA-1"]
                },
                destination: {
                    label: "Destination",
                    help:
                        "The value of the destination in the SAML Authentication Request. Leave this empty to exclude it",
                    rules: [v => (!v || /http(s)?:\/\/.+/.test(v)) || "Must be in URL format. e.g. http(s)//foo"]
                },
                acsUrl: {
                    label: "Assertion Consumer Service (ACS) URL",
                    help:
                        "Specifies whether to use a trust-specific assertion consumer service URL or one that is shared across the organization",
                    select: [
                        { value: "INSTANCE", text: "Trust-specific" },
                        { value: "ORG", text: "Organization(shared)" }
                    ]
                },
                maxClockSkew: {
                    label: "Max Clock Skew",
                    help:
                        "The maximum clock skew used to validate the SubjectConfirmationData NotOnOrAfter condition of assertions issued by the IdP",
                    select: [
                        { value: "1", text: "Milliseconds" },
                        { value: "2", text: "Seconds" },
                        { value: "3", text: "Minutes" }
                    ],
                    rules: [
                        v =>
                            this.idp.policy.maxClockSkew <= 600000 ||
                            "Clock skew cannot exceed 10 minutes"
                    ]
                },
                idpUsername: {
                    label: "IdP Username",
                    help:
                        "Specifies how to construct the subject's username from the SAML assertion using Expression Language (EL) transform of attributes defined in the IdP User Profile",
                    select: [
                        "idpuser.subjectNameId",
                        "idpuser.subjectNameId + '@' + idpuser.subjectNameQualifier",
                        "idpuser.subjectSpProvidedId"
                    ]
                },
                filter: {
                    label:
                        "Only allow usernames that match defined RegEx Pattern",
                    help:
                        "Optional regular expression pattern used to filter IdP username to prevent the IdP from authenticating unintended or privileged users"
                },
                matchAgainst: {
                    label: "Match Against",
                    help:
                        "Specifies what attribute(s) of existing users are compared to the IdP username to determine whether the authentication response is for a new or existing user",
                    select: [
                        { value: "USERNAME", text: "Username" },
                        { value: "EMAIL", text: "Email" },
                        {
                            value: "USERNAME_OR_EMAIL",
                            text: "Username or Email"
                        }
                    ]
                },
                jit: {
                    label: "If no match is found",
                    help:
                        "Specifies the action for authentication purposes that do not match an existing user",
                    select: [
                        { value: "AUTO", text: "Create New User (JIT)" },
                        { value: "DISABLED", text: "Redirect to sign-in page" }
                    ]
                },
                profileMaster: {
                    label: "Profile Master",
                    help:
                        "Determine if the IdP should act as a source of truth for user profile attributes"
                }
            },
            checkboxSignAssertion: true,
            usernameRegexRequired: false,
            clockSkewValue: 0,
            skewValueType: "1",
            alertType: undefined,
            alert: false,
            alertMessage: undefined
        };
    },
    computed: {
        certData() {
            if (!this.certObj) return "";

            let text = "";
            this.certObj.issuer.attributes.forEach((a, i) => {
                text += (i == 0 ? "" : ", ") + a.shortName + "=" + a.value;
            });
            text += "\nNot before: " + this.certObj.validity.notBefore;
            text += "\nNot after: " + this.certObj.validity.notAfter;

            return text;
        },
        heightGeneral() {
            return this.certObj ? this.height + 80 : this.height;
        },
        expandedHeight() {
            return this.checkboxSignAssertion
                ? this.baseHeight + 560
                : this.baseHeight + 490;
        }
    },
    watch: {
        checkboxSignAssertion: "setResponseScope",
        clockSkewValue: "setMaxClockSkew",
        skewValueType: "setMaxClockSkew"
    },
    async created() {
        await this.init();
    },
    props: {
        id: String
    },
    methods: {
        async init() {
            this.height = this.baseHeight;

            const accessToken = await this.$authn.getAccessToken();
            const res = await axios.get(this.$config.api + "/idps/" + this.id, {
                headers: { Authorization: "Bearer " + accessToken }
            });

            if (res.data) {
                this.idp = res.data;
                delete this.idp.id;
                delete this.idp.created;
                delete this.idp.lastUpdated;

                if (res.data.x5c) {
                    this.x5c = res.data.x5c;
                    try {
                        let cert = "";
                        this.x5c.forEach(x => {
                            cert +=
                                "-----BEGIN CERTIFICATE-----\n" +
                                x +
                                "\n-----END CERTIFICATE-----\n";
                        });

                        if (cert.length > 0)
                            this.certObj = forge.pki.certificateFromPem(cert);
                    } catch (e) {
                        console.log(e);
                    }
                }
                this.checkboxSignAssertion =
                    this.idp.protocol.algorithms.request.signature.scope != "NONE";
                if (
                    this.idp.policy.maxClockSkew < 1000 ||
                    this.idp.policy.maxClockSkew % 1000 > 0
                ) {
                    this.clockSkewValue = this.idp.policy.maxClockSkew;
                    this.skewValueType = "1";
                } else if (
                    this.idp.policy.maxClockSkew >= 60000 &&
                    this.idp.policy.maxClockSkew % 60000 == 0
                ) {
                    this.clockSkewValue = this.idp.policy.maxClockSkew / 60000;
                    this.skewValueType = "3";
                } else {
                    this.clockSkewValue = this.idp.policy.maxClockSkew / 1000;
                    this.skewValueType = "2";
                }
                this.usernameRegexRequired =
                    this.idp.policy.subject.filter && this.idp.policy.subject.filter.length > 0 ? true : false;
            }
            this.ready = true;
        },
        async update() {
            this.alert = false;
            this.saving = true;
            if (this.x5c.length > 0) this.idp.x5c = this.x5c;
            else this.idp.protocol.credentials.trust.kid = "";

            if (!this.usernameRegexRequired)
                this.idp.policy.subject.filter = "";

            if (this.idp.policy.provisioning.action != 'AUTO')
                this.idp.policy.provisioning.profileMaster = false;

            const accessToken = await this.$authn.getAccessToken();
            try {
                const res = await axios.put(
                    this.$config.api + "/idps/" + this.id,
                    this.idp,
                    { headers: { Authorization: "Bearer " + accessToken } }
                );
                this.alert = true;
                this.alertMessage = 'Successfully Updated Configuration';
                this.alertType = 'success';
            } catch (e) {
                this.alert = true;
                this.alertMessage = 'Status: ' + e.status + '. Unable to Update Configuration';
                this.alertType = 'error';
            }
            this.saving = false;
        },
        uploadCert(file) {
            this.processingCert = true;
            if (!file) {
                this.clearCert();
                return;
            }
            const reader = new FileReader();
            reader.readAsBinaryString(file);
            const self = this;
            reader.onloadend = function() {
                const arr = [];
                let entry = "";
                const text = reader.result;
                const lines = text.split("\n");
                let firstLineBegins = false;
                let lastLineEnds = false;
                lines.forEach((l, i) => {
                    if (l && l.length > 0) {
                        if (i == 0 && l.toUpperCase().includes("BEGIN"))
                            firstLineBegins = true;
                        lastLineEnds = l.toUpperCase().includes("END")
                            ? true
                            : false;
                        if (lastLineEnds) {
                            arr.push(entry.slice(0, entry.length));
                            entry = "";
                        }

                        if (
                            !l.toUpperCase().includes("BEGIN") &&
                            !l.toUpperCase().includes("END")
                        )
                            entry += l;
                    }
                });
                if (firstLineBegins && lastLineEnds) {
                    try {
                        self.certObj = forge.pki.certificateFromPem(text);
                        // console.log(self.certObj);
                        self.x5c = arr;
                        self.message = undefined;
                    } catch (e) {
                        console.log(e);
                        self.certError();
                    }
                } else {
                    self.certError();
                }
                self.processingCert = false;
            };
        },
        certError() {
            this.x5c = [];
            this.certObj = false;
            this.message = "There was an error reading the certificate file.";
        },
        clearCert() {
            this.x5c = [];
            this.certObj = false;
            this.processingCert = false;
        },
        showAdvanced() {
            if (!this.advanced) {
                this.height = this.expandedHeight;
                this.advancedButton = "Hide " + this.advancedButton;
            } else {
                this.height = this.baseHeight;
                this.advancedButton = this.advancedButton.replace("Hide ", "");
            }
            //toggle
            this.advanced = !this.advanced;
        },
        setResponseScope() {
            if (this.idp) {
                this.idp.protocol.algorithms.request.signature.scope = this
                    .checkboxSignAssertion
                    ? "REQUEST"
                    : "NONE";

                if (this.advanced) this.height = this.expandedHeight;
                else this.height = this.baseHeight;
            }
        },
        setMaxClockSkew() {
            if (this.skewValueType == "1")
                this.idp.policy.maxClockSkew = this.clockSkewValue * 1;
            else if (this.skewValueType == "2")
                this.idp.policy.maxClockSkew = this.clockSkewValue * 1000;
            else this.idp.policy.maxClockSkew = this.clockSkewValue * 60000;

            this.$refs.form;
            if (this.idp.policy.maxClockSkew <= 600000) {
                this.$refs.form.resetValidation();
            }
        },
        async downloadMetadata() {
            const accessToken = await this.$authn.getAccessToken();
            const res = await axios.get(
                this.$config.api + "/idps/" + this.id + '/metadata.xml', {
                    headers: { Authorization: "Bearer " + accessToken }
                }
            );
            if (res.status === 200) {
                const file = new File([res.data], this.idp.name + ".metadata.xml", {type: "application/xml"});
                FileSaver.saveAs(file);
            }
        }
    }
};
</script>