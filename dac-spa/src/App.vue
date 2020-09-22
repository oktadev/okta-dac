<style scoped>
.no-deco {
  text-decoration: none;
}
</style>
<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app clipped dark v-if="authenticated">
      <v-list nav>
        <v-list-item two-line>
          <v-list-item-avatar>
            <img :src="gravatar" />
          </v-list-item-avatar>

          <v-list-item-content @click="$router.push('/tokens')">
            <v-list-item-title>{{ fullName }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ isTenantAdmin ? $t("tenant") : "Super" }}
              Admin
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item v-for="item in menuItems" :key="item.title" link>
          <v-list-item-icon>
            <v-icon color="primary">{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <router-link :to="item.route" class="no-deco white--text">
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </router-link>
        </v-list-item>

        <v-list-item></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn block @click="logout">Logout</v-btn>
        </div>
      </template>
    </v-navigation-drawer>
    <v-app-bar app clipped-left :color="$config.brand.color" dark flat>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" v-if="authenticated" />
      <v-img
        class="mx-2"
        :src="subdomainLogo"
        max-height="50"
        max-width="50"
        @click="$router.push('/')"
        contain
      ></v-img>
      <v-toolbar-title class="headline">
        <span
          class="font-weight-light"
          v-if="!$vuetify.breakpoint.xs"
          @click="$router.push('/')"
          >{{ propercasedSubdomain }} - Forge Admin Console</span
        >
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <div v-if="authenticated && isTenantAdmin">
        <tenant-selector :items="tenants"></tenant-selector>
      </div>

      <div class="pa-4" v-if="authenticated">
        <v-btn @click="logout">Logout</v-btn>
      </div>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import md5 from "md5";
import TenantSelector from "@/components/TenantSelector.vue";
import AuthJS from "@okta/okta-auth-js";

export default {
  name: "App",
  data() {
    return {
      drawer: null,
      authenticated: false,
      user: null,
      superuserFlag: false,
      isTenantAdmin: false,
      items: [
        { title: this.$t("home"), icon: "mdi-home-city", route: "/" },
        {
          title: this.$t("users"),
          icon: "mdi-account-group-outline",
          route: "users",
        },
        {
          title: this.$t("Apps"),
          icon: "mdi-apps",
          route: "apps",
        },         
        {
          title: this.$t("settings"),
          icon: "mdi-account-cog",
          route: "settings",
        },       
      ],
      suItems: [
        { title: this.$t("home"), icon: "mdi-home-city", route: "/" },
        { title: this.$t("tenants"), icon: "mdi-domain", route: "tenants" },
      ],
    };
  },
  computed: {
    subdomain() {
      return window.location.host.split('.')[1] ? window.location.host.split('.')[0] : "honeywell";
    },
    subdomainLogo() {
      return "https://logo.clearbit.com/" + this.subdomain + ".com";
    },
    propercasedSubdomain() {
      return this.subdomain.charAt(0).toUpperCase() + this.subdomain.slice(1).toLowerCase();
    },
    o4oToken() {
      return this.$store.getters.o4oToken;
    },
    tenants() {
      return this.$store.getters.tenants;
    },
    menuItems() {
      return this.isTenantAdmin ? this.items : this.suItems;
    },
    fullName() {
      return this.user ? this.user.name : "";
    },
    gravatar() {
      return this.user
        ? "https://www.gravatar.com/avatar/" + md5(this.user.preferred_username)
        : "";
    },
    companyLogo() {
      let company =
        this.user && Object.prototype.hasOwnProperty.call(this.user, "tenants")
          ? this.user.tenants[0].split(":")[1]
          : "okta";
      return "https://logo.clearbit.com/" + company + ".com";
    },
  },
  components: {
    TenantSelector
  },
  async created() {
    await this.isAuthenticated();
  },
  watch: {
    // Everytime the route changes, check for auth status
    $route: "isAuthenticated",
  },
  methods: {
    setTenants(tenantsClaim) {
      console.log("setting tenants", tenantsClaim)
      let tenants = tenantsClaim.map(function(tenant) {
        let tenantArray = tenant.split(":");
        return {
          idp: tenantArray[0],
          name: tenantArray[1],
          group: tenantArray[2],
          //pendingGroup: tenantArray[3],
        };
      });
      this.$store.commit("setTenants", tenants);
    },    
    tenantLogo(tenantName) {
      return "https://logo.clearbit.com/" + tenantName + ".com";
    },
    async isAuthenticated() {
      let authIsAuthenticated = await this.$auth.isAuthenticated();
      if (this.authenticated != authIsAuthenticated) {
        this.authenticated = authIsAuthenticated;
        if (this.authenticated) {
          this.user = await this.$auth.getUser();
          this.superuserFlag =
            this.user.groups.findIndex((g) => {
              return g == "SUPERUSERS";
            }) >= 0;
          this.isTenantAdmin = Object.prototype.hasOwnProperty.call(
            this.user,
            "tenants"
          ) && this.user.tenants.length > 0;
          if (this.isTenantAdmin) {
            this.setTenants(this.user.tenants);
            this.$store.commit("setActiveTenant", this.$store.getters.tenants[0])
          } else {
            this.setTenants([]);
          }
        }
      }
    },
    home() {
      this.$router.push({
        name: "home",
      });
    },
    async logout() {
      await this.$auth.logout();
      this.$store.commit("logout");
    },
    routeTo(route) {
      const token = this.$store.state.o4oToken;
      if (!token || token.length <= 0) {
        window.location.href = "/" + route;
      } else {
        this.$router.push("/" + route);
      }
    },
  },
};
</script>
