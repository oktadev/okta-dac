<template>
    <v-text-field 
        :class="'body-2 font-weight-light py-0 mb-n4 pr-' + pr"
        :value="value" 
        :label="label" 
        ref="valueToCopy"
        readonly
        dense
        :outlined="outlined"
        :filled="filled"
        :solo="solo"
        :flat="flat"
        :xhide-details="hideDetails"
        >
        <template v-slot:append v-if="!disabled">
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-icon 
                        v-on="on" size="18"
                        class="mt-1"
                        @click="copyText"
                        >
                        mdi-content-copy
                    </v-icon>
                </template>
                <span>Copy</span>
            </v-tooltip>    
        </template>
    </v-text-field>
</template>

<script>
export default {
    name: 'copy-to-clipboard',
    props: {
        value: String,
        label: String,
        disabled: Boolean,
        outlined: Boolean,
        filled: Boolean,
        solo: Boolean,
        flat: Boolean,
        hideDetails: Boolean,
        pr: String
    },
    methods: {
        copyText() {
            let textToCopy = this.$refs.valueToCopy.$el.querySelector('input');
            textToCopy.select();
            document.execCommand("copy");
        }
    }    
}
</script>