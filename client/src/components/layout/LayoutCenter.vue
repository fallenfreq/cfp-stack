<template>
	<div class="sl-center sl-stack" :style="{ '--sl-measure': MAX_WIDTH[maxWidth] }">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { MAX_WIDTH } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	maxWidth: {
		type: String as PropType<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'>,
		default: 'lg',
	},
})
</script>
