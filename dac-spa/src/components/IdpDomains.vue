<template>
    <v-card class="mx-auto pa-2" outlined max-width="700">
        <v-tabs left>
            <template v-for="tenant in idps">
                <v-tab :key="tenant.id">
                    {{tenant.name}}
                </v-tab>
                <v-tab-item :key="tenant.id" class="pa-0">
                    <Domains
                        :tenant="tenant"
                    ></Domains>
                </v-tab-item>
            </template>
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
    }
}
</script>