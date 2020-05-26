<template>
  <div class="mr-4 ml-6 justify-center">
    <transition name="front"
    enter-active-class="animated flipInX"
    leave-active-class="animated flipOutX">
      <v-card :loading="loading" raised max-width="500" v-if="!jwtMode" :class="{animated: (countdown == 1), shake: (countdown ==1)}">
        <v-card-title class="grey justify-center mt-4"><h2>{{ tokenType }}</h2></v-card-title>
        <!-- <v-card-subtitle>Details</v-card-subtitle> -->
          <v-card-text>
            <div class="headline mt-4 justify-center blue--text">
              {{ claims.sub }}
            </div>
          </v-card-text>

          <v-divider class="mx-6"></v-divider>

          <v-list>
            <v-list-item>
              <v-list-item-icon>
                <v-icon :color="tokenColor">{{ tokenIcon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Expires In</v-list-item-title>
                <v-list-item-subtitle class="mt-2 title blue--text">
                  {{ countdownTimer }} 
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item v-for="claim in highlightClaims" v-bind:key="claim.id">
              <v-list-item-icon>
                <v-icon color="green">{{ claim.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ claim.desc }}</v-list-item-title>
                <v-list-item-subtitle class="blue--text">{{
                  getClaim(claim.id)
                }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-divider class="mx-6"></v-divider>

          <v-list>
            <v-list-item
              v-for="claim in Object.keys(customClaims)"
              v-bind:key="claim"
            >
              <v-list-item-icon>
                <v-icon color="green">mdi-account-check-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ claim }}</v-list-item-title>
                <v-list-item-subtitle class="blue--text" v-if="!(listClaims.includes(claim))">{{
                  getClaim(claim)
                }}</v-list-item-subtitle>
                <v-list-item-subtitle class="blue--text" v-else>
                  <v-chip-group active-class="blue accent-4 white--text" outlined column>
                    <v-chip v-for="group in getClaim(claim)" v-bind:key="group">
                      {{ group }}
                    </v-chip>
                  </v-chip-group>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item>
              <v-list-item-icon>
                <v-icon color="green">mdi-telescope</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Scopes</v-list-item-title>
                <v-list-item-subtitle class="blue--text">
                  <v-chip-group active-class="deep-purple accent-4 white--text" column>
                    <v-chip v-for="scope in scopes" v-bind:key="scope">{{
                      scope
                    }}</v-chip>
                  </v-chip-group>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn class="primary" text @click="jwtMode = !jwtMode">
              See {{ jwtMode ? "Details" : "JWT" }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </transition>

      <transition name="back" 
      enter-active-class="animated flipOutX"
      leave-active-class="animated flipInX">
        <v-card :loading="loading" raised max-width="500" v-if="jwtMode">
          <v-card-title class="grey justify-center mt-4"><h2>{{ tokenType }}</h2></v-card-title>
          <!-- <v-card-subtitle>JWT</v-card-subtitle> -->
            <div class="text-wrap ml-4 mt-4">
              <vue-json-pretty
                :path="'res'"
                :show-line="true"
                :show-double-quotes="false"
                :highlight-mouseover-node="true"
                :data="claims"
              >
              </vue-json-pretty>
            </div>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn class="primary" text @click="jwtMode = !jwtMode">
              See {{ jwtMode ? "Details" : "JWT" }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </transition>

  </div>
</template>

<script>
import moment from "moment";
import VueJsonPretty from "vue-json-pretty";

export default {
  name: "token",
  props: ["type"],
  components: {
    VueJsonPretty: VueJsonPretty
  },
  created() {
      let exp = this.type == "o4oToken" ? this.getClaim("exp") : this.token.expiresAt;
      //console.log("Expiration", exp);
      let cur = Math.round(new Date().getTime() / 1000);
      this.countdown =  exp > cur ? (exp - cur) : 0;
      //console.log("Countdown", this.countdown);
  },
  mounted() {},
  computed: {
    tokenType() {
      switch (this.type) {
        case "accessToken":
          return "Access Token";
        case "idToken":
          return "ID Token";
        case "o4oToken":
          return "o4o Token";
      }
      return "Huh?";
    },
    token() {
      if (this.type == "o4oToken") {
        return this.$store.state.o4oToken;
      } else {
        return JSON.parse(localStorage.getItem("okta-token-storage"))[this.type];
      }
    },
    scopes() {
      if (this.type == "o4oToken") {
        return JSON.parse(atob(this.token.split(".")[1])).scp;
      } else {
        return this.token.scopes;
      }
    },
    claims() {
      let at = this.type == "o4oToken" ? this.token : this.token[this.type];
      let claims = JSON.parse(atob(at.split(".")[1]));
      return claims;
    },
    customClaims() {
      var newClaims = Object.keys(this.claims).filter(
        value => !this.regularClaims.includes(value)
      );
      var filtered = newClaims.reduce(
        (obj, key) => ({ ...obj, [key]: this.claims[key] }),
        {}
      );
      return filtered;
    },
    highlightClaims() {
      let hiClaims = [
        { id: "iss", desc: "Issuer", icon: "mdi-bank-outline" },
        { id: "aud", desc: "Audience", icon: "mdi-account-group" },
        { id: "iat", desc: "Issued At", icon: "mdi-clock-outline" }
      ];

      switch (this.type) {
        case "accessToken":
          hiClaims.push({
            id: "cid",
            desc: "Client ID",
            icon: "mdi-application"
          });
          break;
        case "o4oToken": 
          hiClaims.push({
            id: "cid",
            desc: "Client ID",
            icon: "mdi-application"
          });
          break;
        case "idToken":
          hiClaims.push({
            id: "amr",
            desc: "Authentication Method",
            icon: "mdi-key-outline"
          });
          break;
      }

      return hiClaims;
    },
    sub() {
      return this.token.sub;
    },
    counting() {
      return this.countdown > 0;
    },
    tokenColor() {
      return this.countdown > 0 ? "green" : "red";
    },
    tokenIcon() {
      return this.countdown > 0 ? "mdi-timer-sand" : "mdi-timer-sand-empty";
    },
    countdownTimer() {
      let duration = moment.duration(this.countdown, 'seconds');
      return duration.hours() + ":" + duration.minutes()+":"+duration.seconds();
    }
  },
  watch: {
    countdown: {
      handler(value) {
        if (value > 0) {
          setTimeout(() => {
            this.countdown -= 1;
          }, 1000);
        }
      },
      immediate: true
    } 
  },
  data() {
    return {
      jwtMode: false,
      loading: false,
      regularClaims: [
        "ver",
        "jti",
        "iss",
        "aud",
        "iat",
        "exp",
        "cid",
        "uid",
        "scp",
        "sub",
        "nonce",
        "preferred_username",
        "auth_time",
        "at_hash",
        "amr",
        "idp"
      ],
      listClaims: [ "groups", "tenants"],
      countdown: 0
    };
  },
  methods: {
    revoke() {},
    getClaim(claimId) {
      return claimId == "iat"
        ? moment(this.claims[claimId] * 1000).format()
        : this.claims[claimId];
    }
  }
};
</script>

<style scoped>
</style>
