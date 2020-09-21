<template>
  <div>
    <v-select
      v-model="activeTenantId"
      :items="items"
      :label="$t('tenant')"
      item-value="idp"
      item-text="name"
      class="mt-6"
      width="50"
      @change="changeActiveTenant"
      @selected="changeActiveTenant"
      dense
      filled
    ></v-select>
  </div>
</template>

<script>
export default {
  props: {
    items: Array,
  },
  data() {
    return {
      activeTenantId: null,
    };
  },
  created() {
      if (this.$store.getters.activeTenant) {
        this.activeTenantId = this.$store.getters.activeTenant.idp;
      }
  },
  computed: {
    activeTenant() {
      return this.$store.getters.activeTenant;
    },
  },
  watch: {
    '$store.state.activeTenant': function() {
        this.activeTenantId = this.$store.state.activeTenant.idp;
    }
  },
  methods: {
    changeActiveTenant(tenantId) {
      let tenantObj = this.items.filter((tenant) => {
        return tenant.idp === tenantId;
      })[0];
      this.$store.commit("setActiveTenant", tenantObj);
    },
  },
};
</script>
