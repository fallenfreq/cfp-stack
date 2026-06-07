<template>
	<Transition name="hint-fade">
		<button
			v-if="direction !== null"
			class="toolbar-scroll-hint"
			:style="hintStyle"
			@click="scrollToToolbar"
		>
			<span class="material-symbols-rounded">
				{{ direction === 'up' ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
			</span>
		</button>
	</Transition>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ editor: Editor }>()

const direction = ref<'up' | 'down' | null>(null)
const hintTop = ref(0)

const hintStyle = computed(() =>
	direction.value === 'up' ? { top: `${hintTop.value}px` } : { bottom: '16px' },
)

const getNodepathBottom = () => {
	return document.querySelector<HTMLElement>('.node-path')?.getBoundingClientRect().bottom ?? 0
}

const update = () => {
	const toolbar = document.querySelector<HTMLElement>('.floating-toolbar')
	if (!toolbar) {
		direction.value = null
		return
	}

	const toolbarRect = toolbar.getBoundingClientRect()
	const nodepathBottom = getNodepathBottom()

	if (toolbarRect.bottom <= nodepathBottom) {
		hintTop.value = nodepathBottom + 8
		direction.value = 'up'
	} else if (toolbarRect.top >= window.innerHeight) {
		direction.value = 'down'
	} else {
		direction.value = null
	}
}

const scrollToToolbar = () => {
	const toolbar = document.querySelector<HTMLElement>('.floating-toolbar')
	if (!toolbar) return

	const toolbarRect = toolbar.getBoundingClientRect()
	const nodepathBottom = getNodepathBottom()
	const delta = toolbarRect.top - (nodepathBottom + 8)
	window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' })
}

onMounted(() => {
	props.editor.on('transaction', update)
	window.addEventListener('resize', update)
	window.addEventListener('scroll', update, { passive: true })
	update()
})

onUnmounted(() => {
	props.editor.off('transaction', update)
	window.removeEventListener('resize', update)
	window.removeEventListener('scroll', update)
})
</script>

<style>
.toolbar-scroll-hint {
	position: fixed;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4px 12px;
	background: rgba(var(--backgroundSecondary) / 0.9);
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 12px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	cursor: pointer;
	z-index: var(--z-scroll-hint);
	color: rgb(var(--textPrimary));
}

.toolbar-scroll-hint:hover {
	background: rgba(var(--backgroundElement) / 0.95);
}

.hint-fade-enter-active,
.hint-fade-leave-active {
	transition: opacity 0.15s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
	opacity: 0;
}
</style>
