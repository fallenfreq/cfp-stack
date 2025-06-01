<template>
	<div class="p-2">
		<h1 class="text-2xl">Uneditable Heading</h1>
		<p>
			These sections are interactive but they are not editable as they are not apart of the editor.
		</p>
		<VaButton @click="onclick"> Click me </VaButton>
		<p>Button clicked {{ count }} times</p>

		The bit below is editable as it is passed into the slot via the editor.
		<slot />
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

const onclick = () => {
	count.value++
}
</script>
