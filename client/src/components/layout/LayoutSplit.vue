<template>
	<div
		class="sl-split"
		:style="{ '--sl-template': SPLIT_TEMPLATES[split], 'align-items': align }"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { SPLIT_TEMPLATES } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	split: {
		type: String as PropType<'1/4' | '1/3' | '2/5' | '1/2' | '3/5' | '2/3' | '3/4'>,
		default: '1/3',
	},
	align: {
		type: String as PropType<'start' | 'center' | 'end' | 'stretch'>,
		default: 'stretch',
	},
})
</script>
