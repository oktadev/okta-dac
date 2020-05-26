<template>
  <div>
    <v-container fluid grid-list-md>
      <v-layout row wrap>
        <OktaToken type="accessToken"></OktaToken>
        <OktaToken type="idToken"></OktaToken>
        <OktaToken type="o4oToken"></OktaToken>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import OktaToken from "@/components/Token";

export default {
  name: "tokens",
  data() {
    return {};
  },
  components: {
    OktaToken: OktaToken
  }
};
</script>

<style scoped>
.flip-container {
  perspective: 1000px;
}

.flip-container,
.front,
.back {
  height: 100%;
}
</style>
