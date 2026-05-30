import { type NodePos } from '@/utils/editor/editorUtils'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMultiSelectStore = defineStore('multiSelect', () => {
	const positions = ref<NodePos[]>([])

	const sync = (newPositions: NodePos[]) => {
		positions.value = newPositions
	}

	return { positions, sync }
})
