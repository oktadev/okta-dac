<template>
    <v-card>
        <v-card-title>{{action.confirmation.prompt}}</v-card-title>
        <v-card-text>{{action.confirmation.desc}}</v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
                color="blue darken-1"
                text 
                @click="ok"
            ><v-icon dark left>mdi-check</v-icon>OK</v-btn>
            <v-btn 
                text
                @click="close"
            ><v-icon dark left>mdi-minus</v-icon>Close</v-btn>
        </v-card-actions>           
    </v-card>
</template>

<script>
export default {
    name: 'userActionConfirm',
    data() {
        return {

        }
    },
    props: {
        action: Object
    },
    methods: {
        ok() {
            this.$emit('ok', this.action);
        },
        close() {
            this.$emit('close');
        }
    }
}
</script>