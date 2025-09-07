import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useMarkerStore = defineStore('markerStore', () => {
	const allMarkers = ref<
		Record<
			number,
			{
				mapMarkersId: number
				title: string
				lat: number
				lng: number
				tags: string[]
				markerInstance: google.maps.marker.AdvancedMarkerElement
			}
		>
	>({})
	const selectedTags = ref<string[]>([])

	// Filtered markers based on selected tag
	const filteredMarkers = computed(() => {
		if (!selectedTags.value.length) return Object.values(allMarkers.value)
		const tags = selectedTags.value
		return Object.values(allMarkers.value).filter((marker) =>
			tags.some((tag) => marker.tags.includes(tag)),
		)
	})

	const addMarker = (
		markerData: {
			mapMarkersId: number
			title: string
			lat: number
			lng: number
			tags: string[]
		},
		markerInstance: google.maps.marker.AdvancedMarkerElement,
	) => {
		allMarkers.value[markerData.mapMarkersId] = {
			...markerData,
			markerInstance,
		}
	}

	const removeMarker = (mapMarkersId: number) => {
		const marker = allMarkers.value[mapMarkersId]
		if (marker?.markerInstance) {
			marker.markerInstance.map = null
			marker.markerInstance.position = null
		}
		delete allMarkers.value[mapMarkersId]
	}

	// Compute all unique tags
	const allTags = computed(() => {
		const tagsSet = new Set<string>()
		Object.values(allMarkers.value).forEach((marker) => {
			marker.tags.forEach((tag) => tagsSet.add(tag))
		})
		if (selectedTags.value.length && !selectedTags.value.some((tag) => tagsSet.has(tag))) {
			selectedTags.value = []
		}
		return Array.from(tagsSet)
	})

	return {
		allMarkers,
		selectedTags,
		filteredMarkers,
		addMarker,
		removeMarker,
		allTags,
	}
})
