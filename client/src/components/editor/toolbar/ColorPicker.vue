<template>
	<div class="color-picker" @mousedown.stop>
		<div class="cp-header">
			<span class="cp-label sf-loudness-1">{{ headerLabel }}</span>
		</div>

		<div class="cp-row cp-families">
			<button
				v-if="showRemove"
				class="cp-chip cp-chip-clear sf-swatch sf-size-2xs sf-on-hover"
				title="No color"
				@mousedown.prevent
				@click="$emit('remove')"
			/>
			<button
				v-for="family in families"
				:key="family.key"
				class="cp-chip sf-swatch sf-size-2xs sf-on-hover"
				:class="{ 'sf-on-selected': mode === 'palette' && familyKey === family.key }"
				:style="chipStyle(family)"
				:title="family.key"
				@mousedown.prevent
				@click="pickFamily(family.key)"
			/>
		</div>

		<div v-if="activeFamily && activeFamily.shades.length > 1" class="cp-row cp-shades">
			<button
				v-for="(shade, idx) in activeFamily.shades"
				:key="shade.key"
				class="cp-chip sf-swatch sf-size-2xs sf-on-hover"
				:class="{ 'sf-on-selected': mode === 'palette' && shadeIndex === idx }"
				:style="{ background: cssVarColor(shade.cssVar) }"
				:title="shade.key"
				@mousedown.prevent
				@click="pickShade(idx)"
			/>
		</div>

		<div v-if="allowAlpha" class="cp-row cp-alpha">
			<span class="cp-label sf-loudness-1">α</span>
			<input
				type="range"
				class="cp-range sf"
				min="0"
				:max="alphaSteps.length - 1"
				step="1"
				:value="alphaIndex"
				@input="onAlphaInput"
			/>
			<span class="cp-alpha-val sf-loudness-1">{{ Math.round(alpha * 100) }}%</span>
		</div>

		<div class="cp-row cp-freeform">
			<input
				type="color"
				class="cp-color-input sf-swatch sf-size-2xs sf-on-hover"
				:value="freeformHex"
				@input="onFreeformInput"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { cssVarColor } from '@/utils/cssVarColor'
import { useAlphaPalette } from '@/utils/editor/alphaPalette'
import { formatRgba, useColorPalette, type PaletteFamily } from '@/utils/editor/colorPalette'
import { computed, ref, watch } from 'vue'

const { families, findShade, parseStoredValue } = useColorPalette()
const { steps: alphaSteps, snapToStep } = useAlphaPalette()

const props = withDefaults(
	defineProps<{
		value: string | null
		allowAlpha?: boolean
		showRemove?: boolean
	}>(),
	{ allowAlpha: true, showRemove: true },
)

const emit = defineEmits<{ commit: [value: string]; remove: [] }>()

const mode = ref<'palette' | 'freeform' | 'none'>('none')
const familyKey = ref<string>('')
const shadeIndex = ref(0)
const alpha = ref(1)
const freeformHex = ref('#000000')

const alphaIndex = computed(() => {
	const idx = alphaSteps.value.findIndex((s) => s.value === alpha.value)
	if (idx >= 0) return idx
	const snapped = snapToStep(alpha.value)
	return snapped ? alphaSteps.value.indexOf(snapped) : -1
})

const activeFamily = computed<PaletteFamily | undefined>(() =>
	families.value.find((f) => f.key === familyKey.value),
)

const activeShade = computed(() => activeFamily.value?.shades[shadeIndex.value] ?? null)

const headerLabel = computed(() => {
	if (mode.value === 'none') return 'No color'
	if (mode.value === 'freeform') return `Custom ${freeformHex.value}`
	if (!activeShade.value) return ''
	const family = activeFamily.value!
	if (family.shades.length > 1) return `${family.key}-${activeShade.value.key}`
	return family.key
})

// Pick a representative chip color: middle shade for multi-shade, the only shade otherwise.
const chipStyle = (family: PaletteFamily) => {
	const mid = Math.floor(family.shades.length / 2)
	const cssVar = family.shades[mid]?.cssVar
	return cssVar ? { background: cssVarColor(cssVar) } : {}
}

// Seed state from incoming value so the picker reflects what's already applied.
watch(
	() => props.value,
	(value) => {
		const parsed = parseStoredValue(value)
		if (!parsed) {
			mode.value = 'none'
			familyKey.value = ''
			alpha.value = 1
			return
		}
		if (parsed.kind === 'token') {
			const found = findShade(parsed.cssVar)
			if (found) {
				familyKey.value = found.family.key
				shadeIndex.value = found.shadeIndex
				const snapped = snapToStep(parsed.alpha)
				if (snapped) alpha.value = snapped.value
				mode.value = 'palette'
			}
		} else {
			const hex = (n: number) => n.toString(16).padStart(2, '0')
			freeformHex.value = `#${hex(parsed.r)}${hex(parsed.g)}${hex(parsed.b)}`
			const snapped = snapToStep(parsed.a)
			if (snapped) alpha.value = snapped.value
			mode.value = 'freeform'
		}
	},
	{ immediate: true },
)

const pickFamily = (key: string) => {
	familyKey.value = key
	mode.value = 'palette'
	const family = families.value.find((f) => f.key === key)
	if (family && shadeIndex.value >= family.shades.length) shadeIndex.value = 0
	commit()
}

const pickShade = (idx: number) => {
	shadeIndex.value = idx
	commit()
}

const onAlphaInput = (e: Event) => {
	const idx = Number((e.target as HTMLInputElement).value)
	alpha.value = alphaSteps.value[idx]?.value ?? alpha.value
	if (mode.value !== 'none') commit()
}

const onFreeformInput = (e: Event) => {
	freeformHex.value = (e.target as HTMLInputElement).value
	mode.value = 'freeform'
	commit()
}

const formatValue = (): string => {
	if (mode.value === 'freeform') {
		const r = parseInt(freeformHex.value.slice(1, 3), 16)
		const g = parseInt(freeformHex.value.slice(3, 5), 16)
		const b = parseInt(freeformHex.value.slice(5, 7), 16)
		return formatRgba(r, g, b, alpha.value)
	}
	if (!activeShade.value) return ''
	return cssVarColor(activeShade.value.cssVar, alpha.value)
}

const commit = () => {
	const out = formatValue()
	if (out) emit('commit', out)
}
</script>

<style scoped>
@layer ui {
	.color-picker {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-xs));
		min-width: 240px;
	}

	.cp-header {
		min-height: 16px;
	}

	.cp-row {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}

	.cp-families {
		flex-wrap: wrap;
	}

	.cp-chip {
		width: 22px;
		height: 22px;
		cursor: pointer;
	}

	.cp-chip-clear {
		background-image: linear-gradient(
			45deg,
			transparent 45%,
			rgb(var(--sf-danger) / var(--sf-alpha-7)) 45%,
			rgb(var(--sf-danger) / var(--sf-alpha-7)) 55%,
			transparent 55%
		);
	}

	.cp-range {
		flex: 1;
		min-width: 0;
	}

	.cp-label,
	.cp-alpha-val {
		min-width: 24px;
		text-align: center;
	}

	.cp-color-input {
		width: 22px;
		height: 22px;
		cursor: pointer;
	}
}
</style>
