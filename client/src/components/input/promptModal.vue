<template>
  <div v-if="props.isVisible.value" class="prompt-modal">
    <div class="prompt-content">
      <p>{{ message }}</p>
      <input ref="input" v-model="userInput" type="text" @keyup.enter="submit" />
      <div class="button-group">
        <VaButton color="primary" class="submit" @click="submit">Submit</VaButton>
        <VaButton
          color="textPrimary"
          preset="secondary"
          border-color="textPrimary"
          class="cancel"
          @click="close"
          >Cancel</VaButton
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch, type Ref } from 'vue'
import { useColors } from 'vuestic-ui'
const { applyPreset } = useColors()

// refs are normally unwrapped when passed to components
// However this is loaded via createComponent which seem to pass the Ref
const props = defineProps<{
  message: Ref<string>
  isVisible: Ref<boolean>
  rootCurrentPresetName: Ref<string>
}>()

applyPreset(props.rootCurrentPresetName.value)
watch(props.rootCurrentPresetName, () => {
  applyPreset(props.rootCurrentPresetName.value)
})

// Emits
const emit = defineEmits<{
  (e: 'submit', value: string | null): void
}>()

const userInput = ref('')

// Refs
const input = ref<HTMLInputElement | null>(null)

// Submit handler
const submit = () => {
  emit('submit', userInput.value)
  if (input.value) userInput.value = ''
}

// Cancel handler
const close = () => {
  emit('submit', null)
}
</script>

<style scoped>
.prompt-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.prompt-content {
  background: rgb(var(--backgroundSecondary));
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  border-radius: 20px;
  margin: 0, 20px;
  max-width: 500px;
}

.prompt-content input {
  width: 100%;
  min-width: 200px;
  background: rgb(var(--backgroundPrimary));
  padding: 5px;
  margin: 10px 0;
  border-radius: 5px;
}

.button-group {
  display: flex;
  justify-content: space-between;
}
</style>
