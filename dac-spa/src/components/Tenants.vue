<style scoped>
.simple-table-progress-bar {
  height: 2px;
}
.hyperlink {
  color: var(--text-color)
}
</style>

<template>
  <v-card class="mx-auto my-2 pb-n1" max-width="900" min-height="600">
    <v-card-title>
      {{ $t("tenants") }}
      <v-btn
        class="mx-2"
        small
        fab
        color="primary"
        @click="add"
        :disabled="loading"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        v-on:keyup="search_on_keyup"
        :disabled="loading"
      >
      </v-text-field>
    </v-card-title>
    <v-simple-table>
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">Name</th>
            <th class="text-left">Created</th>
          </tr>
          <td colspan="2" class="simple-table-progress-bar">
            <v-progress-linear
              indeterminate
              height="2"
              :active="loading"
            ></v-progress-linear>
          </td>
        </thead>
        <tbody class="blue-grey--text lighten-2">
          <tr v-for="item in tenants" :key="item.id">
            <td>
              <v-tooltip right>
                <template v-slot:activator="{ on }">
                  <a :style="cssVars" class="hyperlink" v-on:click="editItem(item)" v-on="on">{{ item.name }}</a>
                </template>
                <v-card flat color="transparent" class="mx-auto">
                  <div class="white--text caption">View / Manage</div>
                </v-card>
              </v-tooltip>
            </td>
            <td>{{ $utils.offsetDate(item.created) }}</td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    <v-card
      v-if="search.length === 0 && showNext && !searchTyping"
      flat
      class="pa-1"
    >
      <v-progress-linear
        indeterminate
        height="2"
        :active="clickMore"
      ></v-progress-linear>
      <v-btn
        class="mt-1"
        block
        :disabled="loading"
        color="primary"
        @click="more"
        >More</v-btn
      >
    </v-card>
    <v-dialog v-model="dialog" max-width="500px">
      <Tenant :tenant="tenant" :readonly="readonly" v-on:close="close">
      </Tenant>
    </v-dialog>
  </v-card>
</template>

<script>
import axios from "axios";
import Tenant from "@/components/Tenant";
import tinycolor from "tinycolor2";

export default {
  name: "tenants",
  data() {
    return {
      headers: [
        { text: "tenant", value: "name" },
        { text: "created", value: "created" }
      ],
      tenants: [],
      search: "",
      searchResults: [],
      loading: false,
      searchTyping: false,
      clickMore: false,
      dialog: false,
      tenant: undefined,
      readonly: false,
      next: null,
      showNext: true
    };
  },
  computed: {
    cssVars() {
      return {
        '--text-color': this.$config.brand.isDark
          ? tinycolor(this.$vuetify.theme.themes.light.primary).lighten(30)
          : this.$vuetify.theme.themes.light.primary
      }
    }
  },
  created() {
    this.getTenants();
  },
  components: {
    Tenant
  },
  methods: {
    async more() {
      this.clickMore = true;
      await this.getTenants();
      this.clickMore = false;
    },
    async getTenants() {
      this.loading = true;
      const accessToken = await this.$authn.getAccessToken();
      let keepGoing = true;
      try {
        let url = this.$config.api + "/tenants";
        if (this.next) url += "?after=" + this.next;
        const res = await axios.get(url, {
          headers: { Authorization: "Bearer " + accessToken }
        });
        const ids = this.tenants.map(t => {
          return t.id;
        });
        res.data.forEach(t => {
          if (!ids.includes(t.id)) this.tenants.push(t);
        });

        const links = res.headers.link.split(",");
        links.forEach(link => {
          const parts = link.trim().split(";");
          if (parts[1].trim() == 'rel="next"') {
            const linkParams = this.$utils.urlParams(parts[0].split("?")[1]);
            this.next = linkParams.after;
          }
        });
        if (res.data.length > 0) this.showNext = true;
      } catch (e) {
        if (e.response.status == 404) this.showNext = false;

        this.loading = false;
      }
      this.loading = false;
    },
    add() {
      var blank = {
        id: undefined,
        name: "",
        adminFN: "",
        adminLN: "",
        adminEmail: ""
      };
      this.tenant = blank;
      this.tenants.unshift(this.tenant);
      this.readonly = false;
      this.dialog = true;
    },
    close() {
      this.dialog = false;
      if (!this.tenants[0].id) this.tenants.shift();
    },
    editItem(item) {
      this.tenant = item;
      this.dialog = true;
      this.readonly = true;
    },
    async searchTenants() {
      this.loading = true;
      const accessToken = await this.$authn.getAccessToken();

      let url = this.$config.api + "/tenants";
      if (this.search && this.search.length > 0) {
        url += "?search=" + this.search;
        this.searchResults = await axios.get(url, {
          headers: { Authorization: "Bearer " + accessToken }
        });
        this.tenants = this.searchResults.data;
      } else {
        this.next = null;
        this.tenants = [];
        await this.getTenants();
      }
      this.loading = false;
    },
    search_on_keyup() {
      const self = this;
      this.searchTyping = true;
      if (this.typingDelayTimer) {
        clearTimeout(this.typingDelayTimer);
      }
      this.typingDelayTimer = setTimeout(async function() {
        await self.searchTenants();
        self.searchTyping = false;
      }, 400);
    }
  }
};
</script>
