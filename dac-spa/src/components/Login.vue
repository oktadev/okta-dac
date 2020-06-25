<style scoped>
</style>

<template>
  <div class="login">
    <div id="okta-signin-container"></div>
  </div>
</template>

<script>
import OktaSignIn from "@okta/okta-signin-widget";
import "@okta/okta-signin-widget/dist/css/okta-sign-in.min.css";

export default {
  name: "Login",
  mounted: function() {
    this.$nextTick(function() {
      const cfg = {
        baseUrl: this.$config.oidc.issuer.split("oauth2")[0],
        clientId: this.$config.oidc.client_id,
        redirectUri: this.$config.oidc.redirect_uri,
        authParams: {
          pkce: true,
          issuer: this.$config.oidc.issuer,
          scopes: this.$config.oidc.scope.split(" "),
          display: "page"
        },
        features: {
          webauthn: true
        },
        logo: this.$config.brand.logo,
        brandName: this.$config.brand.name,
        colors: {
          brand: this.$config.brand.color
        }
      };
      this.widget = new OktaSignIn(cfg);

      this.widget.authClient.session.exists().then(exists => {
        if (exists) {
          this.$auth.loginRedirect("/", {});
        } else {
          this.widget.renderEl(
            { el: "#okta-signin-container" },
            res => {
              console.log(res);
            },
            err => {
              throw err;
            }
          );
        }
      });
    });
  },
  destroyed() {
    // Remove the widget from the DOM on path change
    this.widget.remove();
  }
};
</script>
