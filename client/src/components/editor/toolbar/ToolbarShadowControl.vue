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
							:class="{ 'is-active': selectedToken === 'none' }"
							@mousedown.prevent
							@click="selectToken('none')"
						>
							none
						</button>
						<button
							v-for="t in SHADOW_OPTIONS"
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

				<template v-if="selectedToken !== 'none'">
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
import { SHADOW_OPTIONS } from '@/config/editor/layoutTokens'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { nodeAt } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { ref, watch } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'
import ToolbarPanel from './ToolbarPanel.vue'

const DEFAULT_SHADOW_COLOR = 'rgb(var(--shadow) / var(--alpha-20))'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const { open, buttonEl, capturedPos, toggle, onClose } = useToolbarNodeControl(props)

const selectedToken = ref<string>('none')
const shadowColor = ref<string>(DEFAULT_SHADOW_COLOR)

watch(open, (isOpen) => {
	if (!isOpen || capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const style = typeof node.attrs.style === 'string' ? node.attrs.style : ''
	const shadow = getStyleProp(style, 'box-shadow')
	const match = shadow.match(/^var\(--shadow-(\w+)\)\s+(.+)$/)
	if (match && SHADOW_OPTIONS.includes(match[1]!)) {
		selectedToken.value = match[1]!
		shadowColor.value = match[2]!
	} else {
		selectedToken.value = 'none'
		shadowColor.value = DEFAULT_SHADOW_COLOR
	}
})

const selectToken = (token: string) => {
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
	const base = typeof node.attrs.style === 'string' ? node.attrs.style : ''
	let s = base

	if (selectedToken.value === 'none') {
		s = setStyleProp(s, 'box-shadow', null)
	} else {
		s = setStyleProp(
			s,
			'box-shadow',
			`var(--shadow-${selectedToken.value}) ${shadowColor.value}`,
		)
	}

	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			style: s || null,
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
	color: rgba(var(--textPrimary) / var(--alpha-60));
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
	border: 1px solid rgba(var(--textPrimary) / var(--alpha-20));
	padding: 0 6px;
	cursor: pointer;
	transition: transform 0.08s;
	font-size: 0.75rem;
	line-height: 1;
	background: none;
	color: rgb(var(--textPrimary));
}

.sp-chip:hover {
	transform: scale(1.05);
	background: rgba(var(--textPrimary) / var(--alpha-8));
}

.sp-chip.is-active {
	outline: 2px solid rgb(var(--primary));
	outline-offset: 1px;
}

.sp-divider {
	height: 1px;
	background: rgba(var(--textPrimary) / var(--alpha-10));
	margin: 0 -4px;
}
</style>
