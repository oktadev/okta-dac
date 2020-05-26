<style scoped>
.label-style {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.57);
}
</style>

<template>
    <v-row no-gutters>
        <v-col>
            <v-select
                v-if="select"
                v-model="content"
                :items="field.select"
                :label="nolabel ? null : field.label"
                :disabled="saving"
                v-on:change="handleInput"
                :filled="filled"
            >
                <template v-slot:append-outer v-if="field.help">
                    <FieldHelp :text="field.help"></FieldHelp>
                </template>
            </v-select>
            <v-text-field
                v-if="text"
                v-model="content"
                :label="nolabel ? null : field.label"
                :disabled="saving"
                :rules="field.rules"
                :required="required"
                v-on:change="handleInput"
                >
                <template v-slot:append-outer v-if="field.help">
                    <FieldHelp :text="field.help"></FieldHelp>
                </template>
            </v-text-field>
            <div v-if="radio">
                <div class="mb-n4 label-style">
                    {{ field.label }}
                </div>
                <v-radio-group
                    class="mx-auto"
                    :row="radiorow"
                    v-model="content"
                    :disabled="saving"
                    v-on:change="handleInput"
                    >
                    <v-radio
                        v-for="type in field.select"
                        :key="type.value"
                        :label="type.text"
                        :value="type.value"
                    ></v-radio>
                    <template v-slot:append>
                        <FieldHelp :text="field.help"></FieldHelp>
                    </template>
                </v-radio-group>
            </div>
            <v-checkbox
                v-if="checkbox"
                v-model="content"
                :label="field.label"
                :disabled="saving"
                v-on:change="handleInput"
                >
                <template v-slot:append>
                    <FieldHelp :text="field.help"></FieldHelp>
                </template>
            </v-checkbox>
        </v-col>
    </v-row>
</template>

<script>
import FieldHelp from "@/components/FieldHelp";

export default {
    name: 'field',
    data() {
        return {
            content: this.value
        }
    },
    props: {
        value: [String, Boolean],
        saving: Boolean,
        field: Object,
        select: Boolean,
        text: Boolean,
        checkbox: Boolean,
        required: Boolean,
        nolabel: Boolean,
        filled: Boolean,
        radio: Boolean,
        radiorow: Boolean
    },
    components: {
        FieldHelp
    },
    methods: {
        handleInput(e) {
            this.$emit('input', this.content);
        },
    }
}
</script>