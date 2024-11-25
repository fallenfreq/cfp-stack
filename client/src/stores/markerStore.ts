import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  const selectedTag = ref<string | null>(null)

  // Filtered markers based on selected tag
  const filteredMarkers = computed(() => {
    if (!selectedTag.value) return Object.values(allMarkers.value)
    const tag = selectedTag.value
    return Object.values(allMarkers.value).filter((marker) => marker.tags.includes(tag))
  })

  const addMarker = (
    markerData: {
      mapMarkersId: number
      title: string
      lat: number
      lng: number
      tags: string[]
    },
    markerInstance: google.maps.marker.AdvancedMarkerElement
  ) => {
    allMarkers.value[markerData.mapMarkersId] = {
      ...markerData,
      markerInstance
    }
  }

  const removeMarker = (mapMarkersId: number) => {
    const marker = allMarkers.value[mapMarkersId]
    if (marker?.markerInstance) {
      marker.markerInstance.map = null
    }
    delete allMarkers.value[mapMarkersId]
  }

  // Compute all unique tags
  const allTags = computed(() => {
    const tagsSet = new Set<string>()
    Object.values(allMarkers.value).forEach((marker) => {
      marker.tags.forEach((tag) => tagsSet.add(tag))
    })
    if (selectedTag.value && !tagsSet.has(selectedTag.value)) selectedTag.value = null
    return Array.from(tagsSet)
  })

  return {
    allMarkers,
    selectedTag,
    filteredMarkers,
    addMarker,
    removeMarker,
    allTags
  }
})
