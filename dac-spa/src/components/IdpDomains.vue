<template>
    <v-card class="mx-auto pa-2" outlined max-width="700">
        <v-tabs left>
            <v-tab>
                {{tenant.name}}
            </v-tab>
            <v-tab-item class="pa-0">
                <Domains
                    :tenant="tenant"
                ></Domains>
            </v-tab-item>
        </v-tabs>
    </v-card>
</template>

<script>
import Domains from "@/components/Domains";

export default {
    name: 'idp-domains',
    data() {
        return {}
    },
    props: {
        idps: Array
    },
    components: {
        Domains
    },
    computed: {
        tenant() {
            return this.$store.getters.activeTenant;
        }
    },
    watch: {
        '$store.state.activeTenant': async function() {

        }
    },
}
</script>