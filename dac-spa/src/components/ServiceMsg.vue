<template>
    <v-banner ref="banner" single-line color="error"  v-model="display">
        <v-icon slot="icon" color="white">mdi-alert-octagon</v-icon>
        <span class="font-weight-light">{{ message }}</span>
        <template v-slot:actions="{ dismiss }">
            <v-btn text color="white" @click="dismiss">Dismiss</v-btn>
        </template>
    </v-banner>
</template>

<script>

export default {
    name: 'service-msg',
    data() {
        return {
            message: '',
            display: false
        }
    },

    methods: {
        onServiceMessage(e){
            this.message = e  
            this.display = true
        }
    }
}
</script>