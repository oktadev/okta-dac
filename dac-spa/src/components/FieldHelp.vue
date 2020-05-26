<template>
    <v-tooltip bottom>
        <template v-slot:activator="{ on }">
            <v-icon v-on="on" size="16" class="mt-1">
                mdi-help-circle-outline
            </v-icon>
        </template>
        <v-card 
            flat color="transparent"
            max-width="330"
            class="mx-auto"
            >
            <div class="white--text caption">{{ text }}</div>
        </v-card>
    </v-tooltip>
</template>

<script>
export default {
    name: 'field-help',
    props: {
        text: String
    }
}
</script>