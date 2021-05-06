<template>
  <v-card flat class="d-flex pa-2">
    <v-tabs icons-and-text left :color="$config.brand.colorAlt">
      <v-tab key="domains"> Domains <v-icon>mdi-at</v-icon> </v-tab>
      <v-tab key="idps">Idp <v-icon>mdi-folder-account-outline</v-icon></v-tab>
      <v-tab-item key="domains">
        <IdpDomains :idps="idps"></IdpDomains>
      </v-tab-item>
      <v-tab-item key="idps">
        <Idps :idps="idps"></Idps>
      </v-tab-item>
    </v-tabs>
  </v-card>
</template>
<script>
import IdpDomains from "@/components/IdpDomains";
import Idps from "@/components/Idps";

export default {
  name: "settings",
  data() {
    return {
      idps: [],
    };
  },
  components: {
    IdpDomains,
    Idps,
  },
  created() {
    this.idps = this.$store.state.verifiedDomains;
  },
};
</script>