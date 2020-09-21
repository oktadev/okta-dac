<template>
    <v-card class="mx-auto pa-2" outlined max-width="700">
        <v-tabs left>
            <v-tab>
                {{tenant.name}}
            </v-tab>
            <v-tab-item class="pa-0">
                <Idp :id="tenant.idp"></Idp>
            </v-tab-item>            
        </v-tabs>
    </v-card>
</template>
<script>
import Idp from '@/components/Idp';

export default {
    name: 'idps',
    data() {
        return {}
    },
    props: {
        idps: Array
    },
    components: {
        Idp
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