<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import type {
  FluidCheckbox,
  FluidCheckboxChangeEvent,
  FluidInput,
  FluidInputChangeEvent,
  FluidInputInputEvent
} from "@fluid-ds/components";

const projectName = ref("Vue serverless consumer");
const approved = ref(true);
const inputRef = ref<FluidInput>();
const checkboxRef = ref<FluidCheckbox>();
const events: Array<{ type: string; detail: unknown }> = [];
const submissions: Array<Array<[string, FormDataEntryValue]>> = [];
const output = ref("Not submitted");

function onInput(event: FluidInputInputEvent) {
  projectName.value = event.detail.value;
  events.push({ type: event.type, detail: event.detail });
}

function onChange(event: FluidInputChangeEvent) {
  projectName.value = event.detail.value;
  events.push({ type: event.type, detail: event.detail });
}

function onApproved(event: FluidCheckboxChangeEvent) {
  approved.value = event.detail.checked;
  events.push({ type: event.type, detail: event.detail });
}

function onSubmit(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement;
  const values = [...new FormData(form).entries()];
  submissions.push(values);
  output.value = JSON.stringify(values);
}

onMounted(() => {
  const contractWindow = window as Window & {
    vueFluid?: Record<string, unknown>;
  };
  contractWindow.vueFluid = {
    events,
    submissions,
    references() {
      return {
        input: inputRef.value?.localName,
        checkbox: checkboxRef.value?.localName,
        inputMatchesDocument: inputRef.value === document.querySelector("#project"),
        checkboxMatchesDocument: checkboxRef.value === document.querySelector("#approved")
      };
    },
    async setProject(value: string) {
      projectName.value = value;
      await nextTick();
      await inputRef.value?.updateComplete;
    },
    async setLabel(value: string) {
      if (!inputRef.value) throw new Error("Vue input ref is unavailable");
      inputRef.value.label = value;
      await inputRef.value.updateComplete;
    }
  };
});
</script>

<template>
  <fluid-card id="contract-card">
    <h1 id="slot-header" slot="header">Vue packed CSR contract</h1>
    <form id="contract-form" @submit.prevent="onSubmit">
      <fluid-input
        id="project"
        ref="inputRef"
        name="project"
        label="Project name"
        required
        :value.prop="projectName"
        @fluid-input="onInput"
        @fluid-change="onChange"
      >
        <span id="slot-prefix" slot="prefix">Prefix</span>
      </fluid-input>
      <fluid-checkbox
        id="approved"
        ref="checkboxRef"
        name="approved"
        value="yes"
        required
        :checked.prop="approved"
        @fluid-change="onApproved"
      >
        Approved
      </fluid-checkbox>
      <fluid-button id="save" type="submit">Save project</fluid-button>
      <button id="reset" type="reset">Reset project</button>
    </form>
    <p id="slot-footer" slot="footer">Vue footer</p>
  </fluid-card>
  <output id="contract-output" aria-live="polite">{{ output }}</output>
</template>
