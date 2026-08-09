<template>
	<ToolbarPanelItem
		icon="rounded_corner"
		:tooltip="tooltip"
		:open="open"
		align="right"
		@toggle="toggle"
		@close="onClose"
	>
		<div class="corners-picker" @mousedown.stop>
			<div class="cp-section">
				<span class="cp-label sf-loudness-1">Corners</span>
				<div class="cp-row">
					<SfChip
						v-for="t in radiusOptions"
						:key="t"
						size="xs"
						:selected="selectedToken === t"
						@mousedown.prevent
						@click="selectToken(t)"
					>
						{{ t }}
					</SfChip>
					<SfChip
						size="xs"
						:selected="selectedToken === 'custom'"
						@mousedown.prevent
						@click="selectToken('custom')"
					>
						custom
					</SfChip>
				</div>
			</div>

			<template v-if="selectedToken === 'custom'">
				<div class="cp-section">
					<div class="cp-row">
						<input
							v-model.number="customUniform"
							type="number"
							min="0"
							class="cp-input sf sf-field sf-size-2xs sf-on-focus sf-on-disabled"
							:disabled="individualized"
							@change="commit"
						>
						<span class="cp-unit sf-loudness-1">px</span>
					</div>
					<label class="cp-check-label">
						<input
							v-model="individualized"
							type="checkbox"
							@change="onIndividualizeToggle"
						>
						Individualize
					</label>
				</div>

				<div v-if="individualized" class="cp-section cp-grid">
					<div class="cp-corner">
						<span class="cp-label sf-loudness-1">TL</span>
						<input
							v-model.number="customCorners.tl"
							type="number"
							min="0"
							class="cp-input sf sf-field sf-size-2xs sf-on-focus sf-on-disabled"
							@change="commit"
						>
					</div>
					<div class="cp-corner">
						<span class="cp-label sf-loudness-1">TR</span>
						<input
							v-model.number="customCorners.tr"
							type="number"
							min="0"
							class="cp-input sf sf-field sf-size-2xs sf-on-focus sf-on-disabled"
							@change="commit"
						>
					</div>
					<div class="cp-corner">
						<span class="cp-label sf-loudness-1">BL</span>
						<input
							v-model.number="customCorners.bl"
							type="number"
							min="0"
							class="cp-input sf sf-field sf-size-2xs sf-on-focus sf-on-disabled"
							@change="commit"
						>
					</div>
					<div class="cp-corner">
						<span class="cp-label sf-loudness-1">BR</span>
						<input
							v-model.number="customCorners.br"
							type="number"
							min="0"
							class="cp-input sf sf-field sf-size-2xs sf-on-focus sf-on-disabled"
							@change="commit"
						>
					</div>
				</div>
			</template>
		</div>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import SfChip from '@/components/SfChip.vue'
import { useToolbarNodeControl } from '@/composables/editor/useToolbarNodeControl'
import { useLayoutTokens } from '@/config/editor/layoutTokens'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { useThemeTokensStore } from '@/stores/themeTokensStore'
import { getClassToken, setClassToken } from '@/utils/editor/classTokens'
import { nodeAt } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { computed, ref, watch } from 'vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const { radiusOptions } = useLayoutTokens()
const store = useThemeTokensStore()

// Token name → integer px. Theme can override --sf-radius-* values; this map
// tracks current root resolutions.
const tokenPx = computed<Record<string, number>>(() =>
	Object.fromEntries(
		store.rootTokens
			.filter((t) => t.name.startsWith('--sf-radius-'))
			.map((t) => [t.name.slice('--sf-radius-'.length), parseInt(t.value) || 0]),
	),
)

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, capturedPos, toggle, onClose } = useToolbarNodeControl(props)

// null = no radius set; string = token name or 'custom'
const selectedToken = ref<string | null>(null)
const customUniform = ref(0)
const individualized = ref(false)
const customCorners = ref({ tl: 0, tr: 0, br: 0, bl: 0 })

watch(open, (isOpen) => {
	if (!isOpen || capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	const style = typeof node.attrs.style === 'string' ? node.attrs.style : ''

	const token = getClassToken(cls, 'sf-radius-')
	if (token !== null) {
		selectedToken.value = token
		individualized.value = false
		return
	}

	// Check for individualized corners in inline style
	const tl = getStyleProp(style, 'border-top-left-radius')
	const tr = getStyleProp(style, 'border-top-right-radius')
	const brr = getStyleProp(style, 'border-bottom-right-radius')
	const bl = getStyleProp(style, 'border-bottom-left-radius')

	if (tl !== tr || tr !== brr || brr !== bl) {
		selectedToken.value = 'custom'
		individualized.value = true
		customCorners.value = {
			tl: parseInt(tl) || 0,
			tr: parseInt(tr) || 0,
			br: parseInt(brr) || 0,
			bl: parseInt(bl) || 0,
		}
		return
	}

	// Uniform custom or nothing
	const br = getStyleProp(style, 'border-radius')
	if (br && br !== '0px') {
		selectedToken.value = 'custom'
		individualized.value = false
		customUniform.value = parseInt(br) || 0
	} else {
		selectedToken.value = null
	}
})

const selectToken = (token: string) => {
	if (token === 'custom' && selectedToken.value !== 'custom') {
		customUniform.value =
			selectedToken.value !== null ? (tokenPx.value[selectedToken.value] ?? 0) : 0
	}
	selectedToken.value = token
	if (token !== 'custom') {
		individualized.value = false
		commit()
	}
}

const onIndividualizeToggle = () => {
	if (individualized.value) {
		customCorners.value = {
			tl: customUniform.value,
			tr: customUniform.value,
			br: customUniform.value,
			bl: customUniform.value,
		}
	} else {
		customUniform.value = customCorners.value.tl
	}
	commit()
}

const commit = () => {
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	let s = typeof node.attrs.style === 'string' ? node.attrs.style : ''

	let newClass = cls
	if (selectedToken.value === null) {
		newClass = setClassToken(cls, 'sf-radius-', null)
		s = setStyleProp(s, 'border-radius', null)
		s = setStyleProp(s, 'border-top-left-radius', null)
		s = setStyleProp(s, 'border-top-right-radius', null)
		s = setStyleProp(s, 'border-bottom-right-radius', null)
		s = setStyleProp(s, 'border-bottom-left-radius', null)
	} else if (selectedToken.value !== 'custom') {
		newClass = setClassToken(cls, 'sf-radius-', selectedToken.value)
		s = setStyleProp(s, 'border-radius', null)
		s = setStyleProp(s, 'border-top-left-radius', null)
		s = setStyleProp(s, 'border-top-right-radius', null)
		s = setStyleProp(s, 'border-bottom-right-radius', null)
		s = setStyleProp(s, 'border-bottom-left-radius', null)
	} else if (!individualized.value) {
		newClass = setClassToken(cls, 'sf-radius-', null)
		s = setStyleProp(s, 'border-top-left-radius', null)
		s = setStyleProp(s, 'border-top-right-radius', null)
		s = setStyleProp(s, 'border-bottom-right-radius', null)
		s = setStyleProp(s, 'border-bottom-left-radius', null)
		s = setStyleProp(s, 'border-radius', `${customUniform.value}px`)
	} else {
		newClass = setClassToken(cls, 'sf-radius-', null)
		s = setStyleProp(s, 'border-radius', null)
		s = setStyleProp(s, 'border-top-left-radius', `${customCorners.value.tl}px`)
		s = setStyleProp(s, 'border-top-right-radius', `${customCorners.value.tr}px`)
		s = setStyleProp(s, 'border-bottom-right-radius', `${customCorners.value.br}px`)
		s = setStyleProp(s, 'border-bottom-left-radius', `${customCorners.value.bl}px`)
	}
	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			class: newClass || null,
			style: s || null,
		}),
	)
}
</script>

<style scoped>
@layer ui {
	.corners-picker {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-xs));
		min-width: 200px;
	}

	.cp-section {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}

	.cp-row {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		flex-wrap: wrap;
	}

	.cp-input {
		width: 56px;
	}

	.cp-check-label {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-xs));
		cursor: pointer;
	}

	.cp-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--sf-gap, var(--sf-spacing-xs));
	}

	.cp-corner {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}
}
</style>
