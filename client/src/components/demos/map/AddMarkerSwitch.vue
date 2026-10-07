<script setup lang="ts">
import { showPrompt } from '@/services/promptModal'
import { notify } from '@/services/toast'
import { useMapStore } from '@/stores/mapStore'
import { useMarkerStore } from '@/stores/markerStore'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import { trpc } from '@/trpc'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { onMounted, ref, toRaw, watch } from 'vue'

export interface MapMarkerItem {
	mapMarkersId: any
	title: string
	lat: number
	lng: number
	tags: string[]
	markerInstance: google.maps.marker.AdvancedMarkerElement
}

const mapStore = useMapStore()
if (!mapStore.map) {
	throw new Error('Map not found in store.')
}

const { openSheet } = useStackableSheetStore()
const root = ref<HTMLElement | null>(null)

defineExpose({ root })

const markerStore = useMarkerStore()

// While on, a click on the map adds a marker there.
const isAddingMarkers = ref(false)
const addListenerRef = ref<google.maps.MapsEventListener | null>(null)

const toggleAddingMarkers = () => {
	isAddingMarkers.value = !isAddingMarkers.value

	if (isAddingMarkers.value && mapStore.map) {
		addListenerRef.value = mapStore.map.addListener('click', onMapClick)
		notify({
			duration: 10000,
			variant: 'info',
			message: 'Click on the map to add a marker.',
		})
	} else {
		addListenerRef.value?.remove()
		addListenerRef.value = null
	}
}

// A new marker goes on the map once the server has saved it; one the server refuses says why
// (config/queryClient.ts).
const markerInsert = useMutation({
	mutationFn: (input: { lat: number; lng: number; title: string; tags: string[] }) =>
		trpc.mapMarker.insert.mutate(input),
	onSuccess: async ({ marker, tags: processedTags }, { lat, lng, title }) => {
		const { AdvancedMarkerElement } = (await google.maps.importLibrary(
			'marker',
		)) as google.maps.MarkerLibrary
		const markerEl = new AdvancedMarkerElement({
			map: toRaw(mapStore.map),
			position: { lat, lng },
			collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior,
			title,
			gmpClickable: true,
		})
		markerEl.addListener('click', () => onMarkerClick(marker.mapMarkersId))

		markerStore.addMarker({ ...marker, tags: processedTags }, markerEl)
		toggleAddingMarkers()
	},
})

const onMapClick = async (event: google.maps.MapMouseEvent) => {
	if (!event.latLng) return
	const latLng = event.latLng

	const title = await showPrompt('Enter a title for the marker:')
	if (!title) {
		console.warn('Marker creation canceled.')
		return
	}
	const tagsInput = await showPrompt('Enter tags for the marker (comma-separated):')

	const tags = tagsInput ? tagsInput.split(',') : []
	markerInsert.mutate({ lat: latLng.lat(), lng: latLng.lng(), title, tags })
}

const onMarkerClick = async (mapMarkersId: number) => {
	const markerData = markerStore.allMarkers[mapMarkersId]
	if (!markerData) return

	openSheet({
		id: 'mapMarker',
		content: markerData,
	})
}

// The map shows the filtered markers only.
const renderMarkers = async () => {
	const { AdvancedMarkerElement } = (await google.maps.importLibrary(
		'marker',
	)) as google.maps.MarkerLibrary

	// The shown markers' bounds, unused: fitting the map to them zooms in too far when only one
	// marker is shown.
	const { LatLngBounds } = (await google.maps.importLibrary('core')) as google.maps.CoreLibrary
	const bounds = new LatLngBounds()

	Object.values(markerStore.allMarkers).forEach((markerData) => {
		if (markerData.markerInstance) {
			markerData.markerInstance.map = null
			markerData.markerInstance.position = null
		}
	})

	markerStore.filteredMarkers.forEach((markerData) => {
		const markerEl = new AdvancedMarkerElement({
			map: toRaw(mapStore.map),
			position: { lat: markerData.lat, lng: markerData.lng },
			collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior,
			title: markerData.title,
		})
		markerEl.addListener('click', () => onMarkerClick(markerData.mapMarkersId))
		markerData.markerInstance = markerEl
		if (markerEl.position) bounds.extend(markerEl.position)
	})
}

// search: text in a title or tag, a marker's id, or a point; none for every marker.
const selectMarkers = (search?: string | number | google.maps.LatLngLiteral) => {
	return useQuery({
		queryKey: ['selectMarkers', search],
		queryFn: () => trpc.mapMarker.select.query({ search }),
	})
}

watch(() => mapStore.map, renderMarkers)
watch(() => markerStore.filteredMarkers, renderMarkers)
const { data: markers } = selectMarkers()

// Markers from the server go into the store as they arrive.
onMounted(async () => {
	watch(
		markers,
		() => {
			if (markers.value) {
				markers.value.forEach(async (marker) => {
					const { AdvancedMarkerElement } = (await google.maps.importLibrary(
						'marker',
					)) as google.maps.MarkerLibrary
					const markerEl = new AdvancedMarkerElement({
						map: toRaw(mapStore.map),
						position: { lat: marker.lat, lng: marker.lng },
						collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior,
						title: marker.title,
					})
					markerStore.addMarker(marker, markerEl)
				})
			}
			renderMarkers()
		},
		{ immediate: true },
	)
})
</script>

<template>
	<!-- Wrapper is the element handed to the map's controls. -->
	<div ref="root">
		<SfIconButton
			icon="plus"
			tooltip="Add marker"
			size="sm"
			class="sf-depth-2"
			:pressed="isAddingMarkers"
			@click="toggleAddingMarkers"
		/>
	</div>
</template>
