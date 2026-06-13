<template>
	<div ref="buttonEl" class="corners-control">
		<ToolbarButton @click="toggle">
			<ToolbarIcon>rounded_corner</ToolbarIcon>
		</ToolbarButton>
		<ToolbarPanel :open="open" :anchor-el="buttonEl" align="right" @close="onClose">
			<div class="corners-picker" @mousedown.stop>
				<div class="cp-section">
					<span class="cp-label">Corners</span>
					<div class="cp-row">
						<button
							v-for="t in RADIUS_OPTIONS"
							:key="t"
							class="cp-chip"
							:class="{ 'is-active': selectedToken === t }"
							@mousedown.prevent
							@click="selectToken(t)"
						>
							{{ t }}
						</button>
						<button
							class="cp-chip"
							:class="{ 'is-active': selectedToken === 'custom' }"
							@mousedown.prevent
							@click="selectToken('custom')"
						>
							custom
						</button>
					</div>
				</div>

				<template v-if="selectedToken === 'custom'">
					<div class="cp-section">
						<div class="cp-row">
							<input
								v-model.number="customUniform"
								type="number"
								min="0"
								class="cp-input"
								:disabled="individualized"
								@change="commit"
							>
							<span class="cp-unit">px</span>
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
							<span class="cp-label">TL</span>
							<input
								v-model.number="customCorners.tl"
								type="number"
								min="0"
								class="cp-input"
								@change="commit"
							>
						</div>
						<div class="cp-corner">
							<span class="cp-label">TR</span>
							<input
								v-model.number="customCorners.tr"
								type="number"
								min="0"
								class="cp-input"
								@change="commit"
							>
						</div>
						<div class="cp-corner">
							<span class="cp-label">BL</span>
							<input
								v-model.number="customCorners.bl"
								type="number"
								min="0"
								class="cp-input"
								@change="commit"
							>
						</div>
						<div class="cp-corner">
							<span class="cp-label">BR</span>
							<input
								v-model.number="customCorners.br"
								type="number"
								min="0"
								class="cp-input"
								@change="commit"
							>
						</div>
					</div>
				</template>
			</div>
		</ToolbarPanel>
	</div>
</template>

<script setup lang="ts">
import cssVariables from '@/../cssVariables'
import { useToolbarNodeControl } from '@/composables/editor/useToolbarNodeControl'
import { RADIUS_OPTIONS } from '@/config/editor/layoutTokens'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { getClassToken, setClassToken } from '@/utils/editor/classTokens'
import { nodeAt } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { ref, watch } from 'vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'
import ToolbarPanel from './ToolbarPanel.vue'

const TOKEN_PX: Record<string, number> = Object.fromEntries(
	Object.entries(cssVariables.root as Record<string, string>)
		.filter(([k]) => k.startsWith('--radius-'))
		.map(([k, v]) => [k.slice('--radius-'.length), parseInt(v) || 0]),
)

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const { open, buttonEl, capturedPos, toggle, onClose } = useToolbarNodeControl(props)

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
			selectedToken.value !== null ? (TOKEN_PX[selectedToken.value] ?? 0) : 0
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
.corners-control {
	position: relative;
}

.corners-picker {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 200px;
	padding: 4px;
}

.cp-section {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.cp-label {
	font-size: 0.7rem;
	color: rgba(var(--text_primary) / var(--alpha-60));
}

.cp-row {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-wrap: wrap;
}

.cp-chip {
	height: 26px;
	border-radius: 4px;
	border: 1px solid rgba(var(--text_primary) / var(--alpha-20));
	padding: 0 6px;
	cursor: pointer;
	transition: transform 0.08s;
	font-size: 0.75rem;
	line-height: 1;
	background: none;
	color: rgb(var(--text_primary));
}

.cp-chip:hover {
	transform: scale(1.05);
	background: rgba(var(--text_primary) / var(--alpha-8));
}

.cp-chip.is-active {
	outline: 2px solid rgb(var(--primary));
	outline-offset: 1px;
}

.cp-input {
	height: 26px;
	width: 56px;
	padding: 2px 6px;
	border-radius: 4px;
	border: 1px solid rgb(var(--border_color));
	background: rgb(var(--bg_primary));
	color: rgb(var(--text_primary));
	font-size: 0.8rem;
	outline: none;
}

.cp-input:focus {
	border-color: rgb(var(--primary));
}

.cp-input:disabled {
	opacity: 0.4;
}

.cp-unit {
	font-size: 0.75rem;
	color: rgba(var(--text_primary) / var(--alpha-60));
}

.cp-check-label {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.75rem;
	color: rgb(var(--text_primary));
	cursor: pointer;
}

.cp-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}

.cp-corner {
	display: flex;
	flex-direction: column;
	gap: 2px;
}
</style>
