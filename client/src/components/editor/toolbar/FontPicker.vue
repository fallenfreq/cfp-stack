<template>
	<div class="font-picker" @mousedown.stop>
		<div class="fp-section">
			<span class="fp-label sf-loudness-1">Family</span>
			<div class="fp-row">
				<SfChip
					size="xs"
					title="Default family"
					:selected="!activeFamily"
					@mousedown.prevent
					@click="pickFamily(null)"
				>
					×
				</SfChip>
				<SfChip
					v-for="f in families"
					:key="f.name"
					size="xs"
					:selected="activeFamily === f.name"
					:style="{ fontFamily: f.value }"
					:title="f.name"
					@mousedown.prevent
					@click="pickFamily(f.name)"
				>
					Aa
				</SfChip>
			</div>
		</div>

		<div class="fp-section">
			<span class="fp-label sf-loudness-1">Size</span>
			<div class="fp-row">
				<SfChip
					size="xs"
					title="Default size"
					:selected="!activeSize"
					@mousedown.prevent
					@click="pickSize(null)"
				>
					×
				</SfChip>
				<SfChip
					v-for="s in sizes"
					:key="s.name"
					size="xs"
					:selected="activeSize === s.name"
					:title="s.value"
					@mousedown.prevent
					@click="pickSize(s.name)"
				>
					{{ s.name }}
				</SfChip>
			</div>
		</div>

		<div class="fp-section">
			<span class="fp-label sf-loudness-1">Leading</span>
			<div class="fp-row">
				<SfChip
					size="xs"
					title="Default line height"
					:selected="!activeLeading"
					@mousedown.prevent
					@click="pickLeading(null)"
				>
					×
				</SfChip>
				<SfChip
					v-for="l in leading"
					:key="l.name"
					size="xs"
					:selected="activeLeading === l.name"
					:title="`line-height: ${l.value}`"
					@mousedown.prevent
					@click="pickLeading(l.name)"
				>
					{{ l.name }}
				</SfChip>
			</div>
		</div>

		<div class="fp-section">
			<span class="fp-label sf-loudness-1">Tracking</span>
			<div class="fp-row">
				<SfChip
					size="xs"
					title="Default letter spacing"
					:selected="!activeTracking"
					@mousedown.prevent
					@click="pickTracking(null)"
				>
					×
				</SfChip>
				<SfChip
					v-for="t in tracking"
					:key="t.name"
					size="xs"
					:selected="activeTracking === t.name"
					:title="`letter-spacing: ${t.value}`"
					@mousedown.prevent
					@click="pickTracking(t.name)"
				>
					{{ t.name }}
				</SfChip>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import SfChip from '@/components/SfChip.vue'
import { SIZE_TO_LEADING, useFontPalette, type FontLooks } from '@/utils/editor/fontPalette'
import { SIZES } from '@somefreq-app/shared/textLooks'
import { ref, watch } from 'vue'

const { families, sizes, leading, tracking } = useFontPalette()

// Each a slot's name ('2', 'lg'), or none.
const props = defineProps<{
	fontFamily: string | null
	fontSize: string | null
	lineHeight: string | null
	letterSpacing: string | null
}>()

// A pick sends only what it changes: a size, with its paired line height.
const emit = defineEmits<{ commit: [looks: Partial<FontLooks>] }>()

const activeFamily = ref<string | null>(null)
const activeSize = ref<string | null>(null)
const activeLeading = ref<string | null>(null)
const activeTracking = ref<string | null>(null)

watch(
	() => [props.fontFamily, props.fontSize, props.lineHeight, props.letterSpacing] as const,
	([fam, size, lead, track]) => {
		activeFamily.value = fam
		activeSize.value = size
		activeLeading.value = lead
		activeTracking.value = track
	},
	{ immediate: true },
)

const pickFamily = (name: string | null) => {
	activeFamily.value = name
	emit('commit', { fontFamily: name })
}

const pickSize = (name: string | null) => {
	activeSize.value = name
	// Auto-pair leading when a size is chosen; clear leading when size is cleared.
	const size = SIZES.find((s) => s === name)
	activeLeading.value = size ? SIZE_TO_LEADING[size] : null
	emit('commit', { fontSize: name, lineHeight: activeLeading.value })
}

const pickLeading = (name: string | null) => {
	activeLeading.value = name
	emit('commit', { lineHeight: name })
}

const pickTracking = (name: string | null) => {
	activeTracking.value = name
	emit('commit', { letterSpacing: name })
}
</script>

<style scoped>
@layer ui {
	.font-picker {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-xs));
		min-width: 240px;
	}

	.fp-section {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}

	.fp-row {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		flex-wrap: wrap;
	}
}
</style>
