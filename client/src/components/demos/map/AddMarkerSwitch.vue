<script setup lang="ts">
import { initPromptModal } from '@/services/promptModal'
import { useMapStore } from '@/stores/mapStore'
import { useMarkerStore } from '@/stores/markerStore'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import { trpc } from '@/trpc'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useQuery } from '@tanstack/vue-query'
import { getCurrentInstance, onMounted, ref, toRaw, watch } from 'vue'
import { useToast } from 'vuestic-ui'

export interface MapMarkerItem {
	mapMarkersId: any
	title: string
	lat: number
	lng: number
	tags: string[]
	markerInstance: google.maps.marker.AdvancedMarkerElement
}

const showPrompt = initPromptModal(getCurrentInstance()?.appContext)

const mapStore = useMapStore()
if (!mapStore.map) {
	throw new Error('Map not found in store.')
}

const { openSheet } = useStackableSheetStore()
const root = ref<HTMLElement | null>(null)

defineExpose({ root })

const markerStore = useMarkerStore()

// State to track if we're in "add marker mode"
const isAddingMarkers = ref(false)
const addListenerRef = ref<google.maps.MapsEventListener | null>(null)

// Function to toggle marker adding mode
const toggleAddingMarkers = () => {
	isAddingMarkers.value = !isAddingMarkers.value

	if (isAddingMarkers.value && mapStore.map) {
		addListenerRef.value = mapStore.map.addListener('click', onMapClick)
		useToast().notify({
			duration: 10000,
			color: 'info',
			position: 'bottom-right',
			message: 'Click on the map to add a marker.'
		})
	} else {
		addListenerRef.value?.remove()
		addListenerRef.value = null
	}
}

// Handle adding a marker
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

	const { marker, tags: processedTags } = await trpc.mapMarker.insert.mutate({
		lat: latLng.lat(),
		lng: latLng.lng(),
		title,
		tags
	})

	const { AdvancedMarkerElement } = (await google.maps.importLibrary(
		'marker'
	)) as google.maps.MarkerLibrary
	const markerEl = new AdvancedMarkerElement({
		map: toRaw(mapStore.map),
		position: { lat: latLng.lat(), lng: latLng.lng() },
		collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior,
		title,
		gmpClickable: true
	})
	markerEl.addListener('click', () => onMarkerClick(marker.mapMarkersId))

	// Add the marker to the store
	markerStore.addMarker({ ...marker, tags: processedTags }, markerEl)
	toggleAddingMarkers()
}

// Handle marker click
const onMarkerClick = async (mapMarkersId: number) => {
	const markerData = markerStore.allMarkers[mapMarkersId]
	if (!markerData) return

	console.log()
	openSheet({
		id: 'mapMarker',
		content: markerData
	})
}

// Render markers based on the store
const renderMarkers = async () => {
	const { AdvancedMarkerElement } = (await google.maps.importLibrary(
		'marker'
	)) as google.maps.MarkerLibrary

	//  create a LatLngBounds object to fit all markers
	const { LatLngBounds } = (await google.maps.importLibrary('core')) as google.maps.CoreLibrary
	const bounds = new LatLngBounds()

	// Clear existing markers on the map
	Object.values(markerStore.allMarkers).forEach((markerData) => {
		if (markerData.markerInstance) {
			markerData.markerInstance.map = null
			markerData.markerInstance.position = null
		}
	})

	// Render filtered markers
	markerStore.filteredMarkers.forEach((markerData) => {
		const markerEl = new AdvancedMarkerElement({
			map: toRaw(mapStore.map),
			position: { lat: markerData.lat, lng: markerData.lng },
			collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior,
			title: markerData.title
		})
		markerEl.addListener('click', () => onMarkerClick(markerData.mapMarkersId))
		markerData.markerInstance = markerEl
		if (markerEl.position) bounds.extend(markerEl.position)
	})

	// This zooms in too much when there is only one marker on display
	// mapStore.map?.fitBounds(bounds)
}

// The queryKey should be text included in a tag or the title of a marker
const selectMarkers = (search?: string | number | google.maps.LatLngLiteral) => {
	return useQuery({
		queryKey: ['selectMarkers', search],
		queryFn: () => trpc.mapMarker.select.query({ search })
	})
}

// Watch for changes to filtered markers and re-render
watch(() => mapStore.map, renderMarkers)
watch(() => markerStore.filteredMarkers, renderMarkers)
const { data: markers } = selectMarkers()

// Load markers from the database on mount
onMounted(async () => {
	watch(
		markers,
		() => {
			if (markers.value) {
				markers.value.forEach(async (marker) => {
					const { AdvancedMarkerElement } = (await google.maps.importLibrary(
						'marker'
					)) as google.maps.MarkerLibrary
					const markerEl = new AdvancedMarkerElement({
						map: toRaw(mapStore.map),
						position: { lat: marker.lat, lng: marker.lng },
						collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior,
						title: marker.title
					})
					markerStore.addMarker(marker, markerEl)
				})
			}
			renderMarkers()
		},
		{ immediate: true }
	)
})
</script>

<template>
	<button
		ref="root"
		class="add-marker-button"
		:style="{ color: isAddingMarkers ? 'rgb(var(--primary))' : 'inherit' }"
		@click="toggleAddingMarkers"
	>
		<FontAwesomeIcon :icon="faPlus" />
	</button>
</template>

<style scoped>
.add-marker-button {
	height: 38px;
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.5rem;
	border-radius: 50%;
	transition: background-color 0.2s;
}

.add-marker-button:hover {
	background-color: rgba(var(--primary), 0.1);
}
</style>
