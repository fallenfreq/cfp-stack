<template>
	<div ref="buttonEl" class="shadow-control">
		<ToolbarButton @click="toggle">
			<ToolbarIcon>shadow</ToolbarIcon>
		</ToolbarButton>
		<ToolbarPanel :open="open" :anchor-el="buttonEl" align="right" @close="onClose">
			<div class="sp-picker" @mousedown.stop>
				<div class="sp-section">
					<span class="sp-label">Shadow</span>
					<div class="sp-row">
						<button
							class="sp-chip"
							:class="{ 'is-active': selectedToken === null }"
							@mousedown.prevent
							@click="selectToken(null)"
						>
							none
						</button>
						<button
							v-for="t in shadowOptions"
							:key="t"
							class="sp-chip"
							:class="{ 'is-active': selectedToken === t }"
							@mousedown.prevent
							@click="selectToken(t)"
						>
							{{ t }}
						</button>
					</div>
				</div>

				<template v-if="selectedToken !== null">
					<div class="sp-divider" />
					<ColorPicker
						:value="shadowColor"
						:show-remove="false"
						@commit="onColorCommit"
					/>
				</template>
			</div>
		</ToolbarPanel>
	</div>
</template>

<script setup lang="ts">
import { useToolbarNodeControl } from '@/composables/editor/useToolbarNodeControl'
import { useLayoutTokens } from '@/config/editor/layoutTokens'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { cssVarColor } from '@/utils/cssVarColor'
import { useAlphaPalette } from '@/utils/editor/alphaPalette'
import { useColorPalette } from '@/utils/editor/colorPalette'
import { nodeAt } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { ref, watch } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'
import ToolbarPanel from './ToolbarPanel.vue'

const DEFAULT_SHADOW_COLOR = 'rgb(var(--sf-shadow) / var(--sf-alpha-2))'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const { open, buttonEl, capturedPos, toggle, onClose } = useToolbarNodeControl(props)
const { shadowOptions } = useLayoutTokens()
const { steps: alphaSteps, snapToStep } = useAlphaPalette()
const { parseStoredValue } = useColorPalette()

// null = no shadow; string = token name from shadowOptions
const selectedToken = ref<string | null>(null)
const shadowColor = ref<string>(DEFAULT_SHADOW_COLOR)

// Shape lives on `sf-shadow-<size>`; exclude the color/alpha siblings.
const readShape = (cls: string): string | null => {
	for (const c of cls.split(/\s+/)) {
		if (!c.startsWith('sf-shadow-')) continue
		if (c.startsWith('sf-shadow-color-') || c.startsWith('sf-shadow-alpha-')) continue
		return c.slice('sf-shadow-'.length)
	}
	return null
}

// Reconstruct the picker's `value` from either the class pair or inline --sf-shadow-color.
const readColor = (cls: string, style: string): string => {
	const colorToken = cls
		.split(/\s+/)
		.find((c) => c.startsWith('sf-shadow-color-'))
		?.slice('sf-shadow-color-'.length)
	if (colorToken) {
		const alphaName = cls
			.split(/\s+/)
			.find((c) => c.startsWith('sf-shadow-alpha-'))
			?.slice('sf-shadow-alpha-'.length)
		const alphaStep = alphaName
			? alphaSteps.value.find((s) => s.cssVar === `--sf-alpha-${alphaName}`)
			: null
		return cssVarColor(`--sf-${colorToken}`, alphaStep?.value ?? 1)
	}
	return getStyleProp(style, '--sf-shadow-color') || DEFAULT_SHADOW_COLOR
}

watch(open, (isOpen) => {
	if (!isOpen || capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	const style = typeof node.attrs.style === 'string' ? node.attrs.style : ''

	const shape = readShape(cls)
	if (shape !== null && shadowOptions.value.includes(shape)) {
		selectedToken.value = shape
		shadowColor.value = readColor(cls, style)
	} else {
		selectedToken.value = null
		shadowColor.value = DEFAULT_SHADOW_COLOR
	}
})

const selectToken = (token: string | null) => {
	selectedToken.value = token
	commit()
}

const onColorCommit = (color: string) => {
	shadowColor.value = color
	commit()
}

const commit = () => {
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const cls0 = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	const style0 = typeof node.attrs.style === 'string' ? node.attrs.style : ''

	// Strip every sf-shadow-* class and any inline --sf-shadow-color; caller re-adds selection.
	let cls = cls0
		.split(/\s+/)
		.filter((c) => c && !c.startsWith('sf-shadow-'))
		.join(' ')
	let style = setStyleProp(style0, '--sf-shadow-color', null)

	if (selectedToken.value !== null) {
		cls = (cls + ` sf-shadow-${selectedToken.value}`).trim()

		// Colour: palette pick → class pair; freeform hex → inline --sf-shadow-color.
		// The default resolves through sf-shadow-<size>'s own fallback, so skip it here —
		// otherwise an unchanged commit would add sf-shadow-color-shadow + sf-shadow-alpha-*
		// classes that render identically but drift the class list.
		if (shadowColor.value && shadowColor.value !== DEFAULT_SHADOW_COLOR) {
			const parsed = parseStoredValue(shadowColor.value)
			if (parsed?.kind === 'token') {
				const suffix = parsed.cssVar.slice('--sf-'.length)
				cls = (cls + ` sf-shadow-color-${suffix}`).trim()
				if (parsed.alpha < 1) {
					const step = snapToStep(parsed.alpha)
					if (step) {
						cls = (
							cls + ` sf-shadow-alpha-${step.cssVar.slice('--sf-alpha-'.length)}`
						).trim()
					}
				}
			} else {
				style = setStyleProp(style, '--sf-shadow-color', shadowColor.value)
			}
		}
	}

	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			class: cls || null,
			style: style || null,
		}),
	)
}
</script>

<style scoped>
.shadow-control {
	position: relative;
}

.sp-picker {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 4px;
}

.sp-section {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.sp-label {
	font-size: 0.7rem;
	color: rgba(var(--text_primary) / var(--sf-alpha-6));
}

.sp-row {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-wrap: wrap;
}

.sp-chip {
	height: 26px;
	border-radius: 4px;
	border: 1px solid rgba(var(--text_primary) / var(--sf-alpha-2));
	padding: 0 6px;
	cursor: pointer;
	transition: transform 0.08s;
	font-size: 0.75rem;
	line-height: 1;
	background: none;
	color: rgb(var(--text_primary));
}

.sp-chip:hover {
	transform: scale(1.05);
	background: rgba(var(--text_primary) / var(--sf-alpha-1));
}

.sp-chip.is-active {
	outline: 2px solid rgb(var(--primary));
	outline-offset: 1px;
}

.sp-divider {
	height: 1px;
	background: rgba(var(--text_primary) / var(--sf-alpha-1));
	margin: 0 -4px;
}
</style>
