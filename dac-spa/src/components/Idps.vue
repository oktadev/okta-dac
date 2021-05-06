<template>
  <v-card class="mx-auto pa-2" outlined max-width="700">
    <v-tabs left :color="$config.brand.colorAlt">
      <template v-for="tenant in idps">
        <v-tab :key="tenant.id">
          {{ tenant.name }}
        </v-tab>
        <v-tab-item :key="tenant.id" class="pa-0">
          <Idp :id="tenant.id"></Idp>
        </v-tab-item>
      </template>
    </v-tabs>
  </v-card>
</template>
<script>
import Idp from "@/components/Idp";

export default {
  name: "idps",
  data() {
    return {};
  },
  props: {
    idps: Array,
  },
  components: {
    Idp,
  },
};
</script>