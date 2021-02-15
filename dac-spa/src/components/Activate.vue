<template>
  <v-card class="mx-auto my-6 pb-1" width="600">
    <v-card-title class="justify-center">{{ welcome }}</v-card-title>
    <v-overlay :value="saving" class="d-flex align-center justify-center">
      <v-progress-circular
        class="my-4"
        indeterminate
        size="80"
        height="20"
        color="white"
      ></v-progress-circular>
    </v-overlay>
    <v-form ref="form" v-model="valid" v-if="!invalidToken">
      <v-card-text class="d-flex justify-center"
        >Please Create Your Account</v-card-text
      >
      <v-card class="ma-4">
        <v-row>
          <v-col>
            <v-text-field
              class="px-4"
              required
              label="Enter a new password"
              v-model="password"
              :rules="passwordRules"
              :type="showPassword ? 'text' : 'password'"
              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="showPassword = !showPassword"
              :disabled="saving"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <div class="caption mx-4 blue-grey--text">
            Password requirements: at least 8 characters, a lowercase letter, an
            uppercase letter, a number and a symbol; no parts of your username.
          </div>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <v-text-field
              class="px-4"
              required
              label="Repeat new password"
              v-model="password2"
              :rules="passwordRules"
              :type="showPassword2 ? 'text' : 'password'"
              :append-icon="showPassword2 ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="showPassword2 = !showPassword2"
              :disabled="saving"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-progress-linear
          v-if="saving"
          indeterminate
          height="2"
        ></v-progress-linear>
        <v-card-actions>
          <v-btn text :disabled="!valid" @click="create"
            >Create My Account</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-form>
  </v-card>
</template>
<script>
import axios from "axios";
import { OktaAuth } from "@okta/okta-auth-js";

export default {
  name: "activate",
  data() {
    return {
      profile: null,
      userId: null,
      invalidToken: false,
      valid: true,
      saving: false,
      showPassword: false,
      showPassword2: false,
      defaultComplexity: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9!@#$%^&*]+)$/,
      passwordRules: [
        (v) => !!v || "New Password is required",
        (v) =>
          this.passwordRequirements(v) ||
          "At least 8 characters, a lowercase letter, an uppercase letter, a number. No parts of your username",
        (v) =>
          !(
            v &&
            this.password &&
            this.password2 &&
            this.password != this.password2
          ) || "Passwords don't match",
      ],
      password: undefined,
      password2: undefined,
      stateToken: false,
    };
  },
  computed: {
    welcome() {
      if (this.invalidToken) {
        return "Invalid Token";
      } else {
        return this.profile ? "Welcome, " + this.profile.firstName : "";
      }
    },
  },
  async created() {
    await this.validateToken();
  },
  methods: {
    async validateToken() {
      try {
        const res = await axios.post(this.$config.org + "/api/v1/authn", {
          token: this.$route.params.token,
        });
        this.profile = res.data._embedded.user.profile;
        this.userId = res.data._embedded.user.id;
        this.stateToken = res.data.stateToken;
      } catch (e) {
        this.invalidToken = true;
      }
    },
    passwordRequirements(v) {
      if (this.defaultComplexity.test(v)) {
        if (v && v.length >= 8) {
          let username = this.profile.login.toLowerCase();
          let lowercase = v.toLowerCase();
          let parts = username.replace("@", ".").split(".");
          parts.pop(); // remove the last part (e.g. ".com")
          let notContainsParts = true;
          parts.forEach((part) => {
            if (lowercase.includes(part)) notContainsParts = false;
          });
          return notContainsParts;
        }
      }
      return false;
    },
    async create() {
      this.saving = true;
      const res = await axios.post(
        this.$config.org + "/api/v1/authn/credentials/reset_password",
        {
          stateToken: this.stateToken,
          newPassword: this.password,
        }
      );
      if (res.status == 200) {
        const oktaAuth = new OktaAuth({
          issuer: this.$config.oidc.issuer.split("/oauth2/")[0],
        });
        const self = this;
        oktaAuth
          .signInWithCredentials({
            username: this.profile.login,
            password: this.password,
          })
          .then(function(transaction) {
            if (transaction.status === 'SUCCESS') {
              self.$auth.session.setCookieAndRedirect(transaction.sessionToken,"/");
            }
            else {
              console.error('We cannot handle the ' + transaction.status + ' status');
            }
          })
          .catch(function(err) {
            console.error(err);
          });
      }
      this.saving = false;
    },
  },
};
</script>
