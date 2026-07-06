<template>
	<div ref="anchorEl">
		<slot name="trigger">
			<MaterialIconButton :tooltip="tooltip" class="sf-is-contained" @click="emit('toggle')">
				{{ icon }}
			</MaterialIconButton>
		</slot>
		<ToolbarPanel :open="open" :anchor-el="anchorEl" :align="align" @close="emit('close')">
			<slot />
		</ToolbarPanel>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ToolbarPanel from './ToolbarPanel.vue'

defineProps<{
	open: boolean
	icon?: string
	tooltip?: string
	align?: 'left' | 'right'
}>()

const emit = defineEmits<{ toggle: []; close: [] }>()
const anchorEl = ref<HTMLElement | null>(null)
</script>
