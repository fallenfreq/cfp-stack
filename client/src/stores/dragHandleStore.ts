import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDragHandleStore = defineStore('dragHandle', () => {
	const activeDepth = ref(1)

	const setActiveDepth = (depth: number) => {
		activeDepth.value = depth
	}

	return { activeDepth, setActiveDepth }
})
