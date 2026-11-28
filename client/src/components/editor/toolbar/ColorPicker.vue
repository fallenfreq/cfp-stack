<template>
	<div class="color-picker" @mousedown.stop>
		<div class="cp-header">
			<span class="cp-label sf-loudness-1">{{ headerLabel }}</span>
		</div>

		<div class="cp-row cp-families">
			<button
				class="cp-chip cp-chip-clear sf-swatch sf-size-2xs sf-on-hover"
				:title="noneLabel"
				@mousedown.prevent
				@click="$emit('remove')"
			/>
			<button
				v-for="family in families"
				:key="family.key"
				class="cp-chip sf-swatch sf-size-2xs sf-on-hover"
				:class="{ 'sf-on-selected': picked && familyKey === family.key }"
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
				:class="{ 'sf-on-selected': picked && shadeIndex === idx }"
				:style="{ background: swatchColor({ color: shade.name, alpha: null }) }"
				:title="shade.key"
				@mousedown.prevent
				@click="pickShade(idx)"
			/>
		</div>

		<div v-if="allowAlpha && picked" class="cp-row cp-alpha">
			<span class="cp-label sf-loudness-1">α</span>
			<input
				type="range"
				class="cp-range sf"
				min="0"
				:max="alphaSteps.length"
				step="1"
				:value="alphaIndex"
				@input="onAlphaInput"
			/>
			<span class="cp-alpha-val sf-loudness-1">{{ alphaLabel }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	swatchColor,
	useColorPalette,
	type PaletteFamily,
	type ThemeColor,
} from '@/utils/editor/colorPalette'
import { computed, ref, watch } from 'vue'

const { families, alphaSteps, findShade } = useColorPalette()

const props = withDefaults(
	defineProps<{
		/** The theme colour applied, or null for none. */
		value: ThemeColor | null
		/** A colour not from the theme is applied: it shows over a theme colour, as on the page. */
		fixed?: boolean
		/** What no colour picked means here. */
		noneLabel?: string
		allowAlpha?: boolean
	}>(),
	{ fixed: false, noneLabel: 'No colour', allowAlpha: true },
)

const emit = defineEmits<{ commit: [value: ThemeColor]; remove: [] }>()

// Whether a theme colour is picked; the slider shows once one is.
const picked = ref(false)
const familyKey = ref<string>('')
const shadeIndex = ref(0)
// The see-through step's name, or null for solid.
const alpha = ref<string | null>(null)

// The slider's positions are the steps, most see-through first, then solid.
const alphaIndex = computed(() => {
	const idx = alphaSteps.value.findIndex((s) => s.name === alpha.value)
	return idx >= 0 ? idx : alphaSteps.value.length
})

const alphaLabel = computed(
	() => alphaSteps.value.find((s) => s.name === alpha.value)?.label ?? '100%',
)

const activeFamily = computed<PaletteFamily | undefined>(() =>
	families.value.find((f) => f.key === familyKey.value),
)

const activeShade = computed(() => activeFamily.value?.shades[shadeIndex.value] ?? null)

const headerLabel = computed(() => {
	// A class the theme makes no colour for (`sf-color-brand`) isn't one of its colours either.
	if (props.fixed || (props.value && !picked.value)) return 'Not a theme colour'
	if (!picked.value) return props.noneLabel
	if (!activeShade.value) return ''
	// The colour's name in the theme: a step (`primary-5`), or one of its own (`primary`).
	return activeShade.value.name
})

// Pick a representative chip color: the middle step for a scale, the only shade otherwise.
const chipStyle = (family: PaletteFamily) => {
	const steps = family.shades.filter((s) => s.key !== s.name)
	const from = steps.length ? steps : family.shades
	const mid = from[Math.floor(from.length / 2)]
	return mid ? { background: swatchColor({ color: mid.name, alpha: null }) } : {}
}

// Seed state from incoming value so the picker reflects what's already applied.
watch(
	() => props.value,
	(value) => {
		const found = value ? findShade(value.color) : null
		picked.value = !!found
		familyKey.value = found?.family.key ?? ''
		shadeIndex.value = found?.shadeIndex ?? 0
		alpha.value = value?.alpha ?? null
	},
	{ immediate: true },
)

const pickFamily = (key: string) => {
	familyKey.value = key
	picked.value = true
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
	alpha.value = alphaSteps.value[idx]?.name ?? null
	commit()
}

const commit = () => {
	if (activeShade.value) emit('commit', { color: activeShade.value.name, alpha: alpha.value })
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
			rgb(var(--sf-danger_ink) / var(--sf-alpha-7)) 45%,
			rgb(var(--sf-danger_ink) / var(--sf-alpha-7)) 55%,
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
}
</style>
