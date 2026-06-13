<template>
	<div class="color-picker" @mousedown.stop>
		<div class="cp-header">
			<span class="cp-label">{{ headerLabel }}</span>
		</div>

		<div class="cp-row cp-families">
			<button
				v-if="showRemove"
				class="cp-chip cp-chip-clear"
				title="No color"
				@mousedown.prevent
				@click="$emit('remove')"
			/>
			<button
				v-for="family in PALETTE_FAMILIES"
				:key="family.key"
				class="cp-chip"
				:class="{ 'is-active': mode === 'palette' && familyKey === family.key }"
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
				class="cp-chip"
				:class="{ 'is-active': mode === 'palette' && shadeIndex === idx }"
				:style="{ background: cssVarColor(shade.cssVar) }"
				:title="shade.key"
				@mousedown.prevent
				@click="pickShade(idx)"
			/>
		</div>

		<div v-if="allowAlpha" class="cp-row cp-alpha">
			<span class="cp-label">α</span>
			<input
				type="range"
				class="cp-range"
				min="0"
				:max="ALPHA_STEPS.length - 1"
				step="1"
				:value="alphaIndex"
				@input="onAlphaInput"
			>
			<span class="cp-alpha-val">{{ Math.round(alpha * 100) }}%</span>
		</div>

		<div class="cp-row cp-freeform">
			<input
				type="color"
				class="cp-color-input"
				:value="freeformHex"
				@input="onFreeformInput"
			>
		</div>
	</div>
</template>

<script setup lang="ts">
import { cssVarColor } from '@/utils/cssVarColor'
import { ALPHA_STEPS, snapToStep } from '@/utils/editor/alphaPalette'
import {
	PALETTE_FAMILIES,
	findShade,
	formatRgba,
	parseStoredValue,
	type PaletteFamily,
} from '@/utils/editor/colorPalette'
import { computed, ref, watch } from 'vue'

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
	const idx = ALPHA_STEPS.findIndex((s) => s.value === alpha.value)
	return idx >= 0 ? idx : ALPHA_STEPS.indexOf(snapToStep(alpha.value))
})

const activeFamily = computed<PaletteFamily | undefined>(() =>
	PALETTE_FAMILIES.find((f) => f.key === familyKey.value),
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
				alpha.value = snapToStep(parsed.alpha).value
				mode.value = 'palette'
			}
		} else {
			const hex = (n: number) => n.toString(16).padStart(2, '0')
			freeformHex.value = `#${hex(parsed.r)}${hex(parsed.g)}${hex(parsed.b)}`
			alpha.value = snapToStep(parsed.a).value
			mode.value = 'freeform'
		}
	},
	{ immediate: true },
)

const pickFamily = (key: string) => {
	familyKey.value = key
	mode.value = 'palette'
	const family = PALETTE_FAMILIES.find((f) => f.key === key)
	if (family && shadeIndex.value >= family.shades.length) shadeIndex.value = 0
	commit()
}

const pickShade = (idx: number) => {
	shadeIndex.value = idx
	commit()
}

const onAlphaInput = (e: Event) => {
	const idx = Number((e.target as HTMLInputElement).value)
	alpha.value = ALPHA_STEPS[idx]?.value ?? alpha.value
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
.color-picker {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 240px;
	padding: 4px;
}

.cp-header {
	min-height: 16px;
	font-size: 0.75rem;
	color: rgba(var(--textPrimary) / var(--alpha-70));
}

.cp-row {
	display: flex;
	align-items: center;
	gap: 4px;
}

.cp-families {
	flex-wrap: wrap;
}

.cp-chip {
	width: 22px;
	height: 22px;
	border-radius: 4px;
	border: 1px solid rgba(var(--textPrimary) / var(--alpha-20));
	padding: 0;
	cursor: pointer;
	transition: transform 0.08s;
}

.cp-chip:hover {
	transform: scale(1.1);
}

.cp-chip.is-active {
	outline: 2px solid rgb(var(--primary));
	outline-offset: 1px;
}

.cp-chip-clear {
	background-image: linear-gradient(
		45deg,
		transparent 45%,
		rgba(var(--danger) / var(--alpha-70)) 45%,
		rgba(var(--danger) / var(--alpha-70)) 55%,
		transparent 55%
	);
}

.cp-range {
	flex: 1;
	min-width: 0;
	accent-color: rgb(var(--primary));
}

.cp-label,
.cp-alpha-val {
	font-size: 0.7rem;
	color: rgba(var(--textPrimary) / var(--alpha-60));
	min-width: 24px;
	text-align: center;
}

.cp-color-input {
	width: 30px;
	height: 24px;
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 3px;
	padding: 0;
	background: none;
	cursor: pointer;
}
</style>
