<template>
	<div class="sf-depth-1 sl-stack sf-gap-sm">
		<h1 class="sf-heading-2">Uneditable Heading</h1>
		<p>
			These sections are interactive but they are not editable as they are not a part of the
			editor.
		</p>
		<div class="sl-cluster sl-align-y-center sf-gap-sm">
			<SfButton @click="onclick">Click me</SfButton>
			<p>Button clicked {{ count }} times</p>
		</div>
		<p>The bit below is editable as it is passed into the slot via the editor.</p>
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
