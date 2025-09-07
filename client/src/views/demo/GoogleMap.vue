<!-- This needs breaking up but I had a tight deadline and added more features than I was originally planning -->
<script lang="ts" setup>
/// <reference types="google.maps" />
import AddMarkerSwitch from '@/components/demos/map/AddMarkerSwitch.vue'
import GoogleAutocomplete from '@/components/demos/map/GoogleAutocomplete.vue'
import CurrentLocationMarker from '@/components/demos/map/currentLocation.vue'
import { initPromptModal } from '@/services/promptModal'
import { useDarkModeStore } from '@/stores/darkModeStore'
import { useMapStore } from '@/stores/mapStore'
import { useMarkerStore } from '@/stores/markerStore'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import { trpc } from '@/trpc'
import { faMinus, faPen, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Loader, type LoaderOptions } from '@googlemaps/js-api-loader'
import { storeToRefs } from 'pinia'
import { computed, getCurrentInstance, nextTick, onMounted, ref, useCssModule, watch } from 'vue'
import { useToast } from 'vuestic-ui'

const showPrompt = initPromptModal(getCurrentInstance()?.appContext)

// import zitadelAuth from '@/services/zitadelAuth'
// const user = computed(() => zitadelAuth.oidcAuth.userProfile)

const markerStore = useMarkerStore()

const clearFilter = (tag?: string) => {
	if (tag) {
		markerStore.selectedTags = markerStore.selectedTags.filter((selectedTag) => selectedTag !== tag)
	} else {
		markerStore.selectedTags = []
	}
}

const mapStore = useMapStore()
const darkModeStore = useDarkModeStore()

const sheetStore = useStackableSheetStore()
const { isSheetOpen, sheetContent } = storeToRefs(sheetStore)
const { closeSheet } = sheetStore

const mapsControlsStyle = useCssModule(/*'mapsControls'*/)

// Computed property for efficient outline calculation
const isTagOutlined = computed(() => {
	return markerStore.allTags.map((tag) => !markerStore.selectedTags.includes(tag))
})

// Map container reference
const mapContainer = ref<HTMLDivElement | null>(null)

// Refs for controls
const googleAutocomplete = ref<typeof GoogleAutocomplete | null>(null)
const addMarkerSwitch = ref<typeof AddMarkerSwitch | null>(null)

const renderMap = async (loader: Loader) => {
	if (!mapContainer.value) {
		console.error('Map container ref not found')
		throw new Error('Map container ref not found')
	}

	const { Map } = await loader.importLibrary('maps')

	// https://developers.google.com/maps/documentation/javascript/reference/control
	const mapControls = {
		mapTypeControl: true,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
			position: google.maps.ControlPosition.INLINE_END_BLOCK_END,
		},
		zoomControl: true,
		zoomControlOptions: {
			position: google.maps.ControlPosition.LEFT_CENTER,
		},
		scaleControl: true,
		streetViewControl: true,
		streetViewControlOptions: {
			position: google.maps.ControlPosition.LEFT_CENTER,
		},
		fullscreenControl: true,
		fullscreenControlOptions: {
			position: google.maps.ControlPosition.BLOCK_START_INLINE_END,
		},
	}

	// @ts-expect-error: ColorScheme is not typed in the @types/google.maps library
	const { ColorScheme } = await google.maps.importLibrary('core')
	// Map options
	const mapOptions: google.maps.MapOptions = {
		center: mapStore.map?.getCenter() || mapStore.defaultCenter,
		zoom: mapStore.map?.getZoom() || 11,
		mapId: 'DEMO_MAP_ID',
		colorScheme: darkModeStore.isDarkMode ? ColorScheme.DARK : ColorScheme.LIGHT,
		...mapControls,
	}
	mapStore.setMap(new Map(mapContainer.value, mapOptions))
}

let loader: Loader

onMounted(async () => {
	// Initialize the Google Maps loader
	const loaderOptions: LoaderOptions = {
		apiKey: await trpc.keys.googleMapsApiKey.query(),
		version: 'weekly',
		libraries: ['places', 'marker'],
	}
	loader = new Loader(loaderOptions)
	renderMap(loader)
})

watch(isSheetOpen, () => {
	if (!isSheetOpen) deleteMode.value = false
})
watch(
	() => darkModeStore.isDarkMode,
	() => renderMap(loader)
)
watch(
	() => mapStore.map,
	async () => {
		await nextTick()
		if (!mapStore.map || !googleAutocomplete.value || !addMarkerSwitch.value) return

		// Add Autocomplete
		const autocompleteEl = googleAutocomplete.value.root
		autocompleteEl.classList.add(mapsControlsStyle['spacing'])
		mapStore.map.controls[google.maps.ControlPosition.TOP_LEFT]?.push(autocompleteEl)

		// Add Marker Switch
		const addMarkerSwitchEl = addMarkerSwitch.value.root
		addMarkerSwitchEl.classList.add(mapsControlsStyle['spacing'])
		mapStore.map.controls[google.maps.ControlPosition.TOP_LEFT]?.push(addMarkerSwitchEl)

		useToast().notify({
			duration: 10000,
			color: 'info',
			position: 'bottom-right',
			message: 'Click the plus button "+" at the top to enter "add marker mode"',
		})
	}
)

const deleteMarker = async (
	event: MouseEvent,
	marker: google.maps.marker.AdvancedMarkerElement
) => {
	if (!(event.currentTarget instanceof HTMLButtonElement)) return
	const { toDeleteId } = event.currentTarget.dataset
	if (!toDeleteId) return
	try {
		const markerId = parseInt(toDeleteId)
		await trpc.mapMarker.delete.mutate(markerId)
		// Remove the marker from the map
		marker.position = null
		marker.map = null
		markerStore.removeMarker(markerId)
		closeSheet()
	} catch (error) {
		console.error('Error deleting marker:', error)
	}
}
const { open } = window

const deleteMode = ref(false)

// Delete a tag from the marker
const deleteTagFromMarker = async (tag: string) => {
	if (!sheetContent.value || sheetContent.value.id !== 'mapMarker') return
	const markerId = sheetContent.value.content.mapMarkersId

	try {
		await trpc.mapMarker.deleteTagFromMarker.mutate({ markerId, tag })
		// Update tags locally after deletion
		sheetContent.value.content.tags = sheetContent.value.content.tags.filter((t) => t !== tag)
	} catch (error) {
		console.error('Error deleting tag:', error)
	}
}

// Open the prompt for adding tags
const openAddTagPrompt = async () => {
	const newTags = await showPrompt('Enter new tags separated by commas:')
	if (!newTags) return

	if (!sheetContent.value || sheetContent.value.id !== 'mapMarker') return
	const markerId = sheetContent.value.content.mapMarkersId

	try {
		// this only take one tag need to make it take more than one and return the added tags
		const addedTags = await trpc.mapMarker.addTagsToMarker.mutate({
			markerId,
			tags: newTags,
		})
		// Update tags locally after addition
		sheetContent.value.content.tags.push(...addedTags)
	} catch (error) {
		console.error('Error adding tags:', error)
	}
}

const onTagClick = (tag: string) => {
	return markerStore.selectedTags.includes(tag)
		? clearFilter(tag) // Case 1: Tag is already selected, so clear it.
		: [tag, ...markerStore.selectedTags].length === markerStore.allTags.length
			? clearFilter() // Case 2: Adding this tag selects all tags, so clear everything.
			: markerStore.selectedTags.push(tag) // Case 3: Add the tag to selectedTags.
}

const openTitleEditPrompt = async (markerContent: { mapMarkersId: number; title: string }) => {
	const newTitle = await showPrompt('Enter the new title:')
	if (newTitle === null || newTitle.trim() === '') {
		// User canceled or didn't provide input
		return
	}

	try {
		// Send the new title to the server
		await trpc.mapMarker.update.mutate({
			markerId: markerContent.mapMarkersId,
			title: newTitle,
		})

		// Update the title locally
		markerContent.title = newTitle

		useToast().notify({
			duration: 5000,
			color: 'primary',
			message: 'Title updated successfully!',
		})
	} catch (error) {
		console.error('Error updating title:', error)
		useToast().notify({
			duration: 5000,
			color: 'danger',
			message: 'Failed to update title. Please try again.',
		})
	}
}
</script>

<template>
	<!-- Section above the map -->
	<div class="marker-info-container">
		<div class="marker-info-header">
			<h3 class="text-3xl marker-info-text">
				{{
					markerStore.selectedTags.length
						? `"${markerStore.selectedTags.join(', ')}" markers are being displayed`
						: 'All markers are displayed'
				}}
			</h3>
			<VaButton
				:disabled="!markerStore.selectedTags.length"
				size="small"
				@click="() => clearFilter()"
			>
				All markers
			</VaButton>
		</div>

		<VaDivider />
		<div v-if="markerStore.allTags.length" class="all-tags-container">
			<VaChip
				v-for="(tag, index) in markerStore.allTags"
				:key="tag"
				:outline="isTagOutlined[index]!"
				size="small"
				class="tag-chip"
				@click="() => onTagClick(tag)"
			>
				{{ tag }}
			</VaChip>
		</div>
	</div>

	<!-- StackableSheet with marker details -->
	<StackableSheet mobile-height="50%" desktop-width="65%" @close="closeSheet">
		<div v-if="sheetContent?.id === 'mapMarker'">
			<h3 class="text-3xl font-bold">Marker Details</h3>
			<pre>
Title: {{ sheetContent.content.title }} <span><FontAwesomeIcon 
      :icon="faPen" 
      class="edit-title-icon" 
      @click="() => sheetContent?.id === 'mapMarker' && openTitleEditPrompt(sheetContent.content)"
    /></span>
Marker ID: {{ sheetContent.content.mapMarkersId }}
Latitude: {{ sheetContent.content.lat }}
Longitude: {{ sheetContent.content.lng }}

Tags</pre>
			<div class="marker-tags-section">
				<div v-if="sheetContent.content.tags.length" class="tags-container">
					<VaChip
						v-for="(tag, index) in sheetContent.content.tags"
						:key="tag"
						class="tag-chip"
						:outline="isTagOutlined[index]!"
						size="small"
						:color="deleteMode ? 'danger' : ''"
						@click="
							async () => {
								if (deleteMode) {
									await deleteTagFromMarker(tag)
									deleteMode = !deleteMode
								} else {
									onTagClick(tag)
								}
							}
						"
					>
						{{ tag }}
					</VaChip>
				</div>

				<FontAwesomeIcon :icon="faPlus" class="tag-add-button" @click="openAddTagPrompt" />
				<FontAwesomeIcon
					v-if="sheetContent.content.tags.length"
					:icon="faMinus"
					class="tag-delete-toggle"
					color="deleteMode ? 'danger' : undefined"
					@click="
						() => {
							;(deleteMode = !deleteMode)
								&& useToast().notify({
									duration: 10000,
									color: 'info',
									position: 'bottom-right',
									message:
										'Clicking a tag while they are red will delete the tag.\nClick - again or close the marker to cancel.',
								})
						}
					"
				/>
			</div>

			<div class="Marker-info-button-group">
				<VaButton
					class="all-markers-button"
					:disabled="!markerStore.selectedTags.length"
					@click="markerStore.selectedTags = []"
				>
					All markers
				</VaButton>

				<VaButton
					@click="
						open(
							`https://maps.google.com/?q=${sheetContent.content.lat},${sheetContent.content.lng}`,
							'_blank'
						)
					"
				>
					Directions
				</VaButton>
				<VaButton
					:data-to-delete-id="sheetContent.content.mapMarkersId"
					color="danger"
					@click="
						(event: MouseEvent) =>
							sheetContent?.id === 'mapMarker'
							&& deleteMarker(event, sheetContent.content.markerInstance)
					"
				>
					Delete Marker
				</VaButton>
			</div>
		</div>
	</StackableSheet>

	<!-- Map container -->
	<div id="map" ref="mapContainer" />
	<div style="display: none">
		<GoogleAutocomplete v-if="mapStore.map" ref="googleAutocomplete" :map="mapStore.map" />
		<AddMarkerSwitch v-if="mapStore.map" ref="addMarkerSwitch" />
		<CurrentLocationMarker v-if="mapStore.map" />
	</div>
</template>

<!-- module="mapsControls" -->
<style module>
.spacing {
	margin: 10px 0 0 10px;
}
</style>

<style scoped>
.tag-chip {
	font-weight: bold;
	cursor: pointer;
}

.marker-info-container {
	margin: 0 2rem 2rem 2rem;
}

.marker-info-header {
	display: grid;
	grid-template-columns: 1fr auto; /* Text takes remaining space, button fits content */
	gap: 1rem; /* Spacing between text and button */
	align-items: center; /* Aligns items vertically */
}

.Marker-info-button-group {
	display: flex;
	gap: 0.5rem;
}

.all-tags-container {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 2rem;
}

.marker-tags-section,
.tags-container {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	align-items: center;
}

.marker-tags-section {
	margin-bottom: 1rem;
	margin-top: 0.5rem;
}

#map {
	height: 100vh;
}

.tag-add-button,
.tag-delete-toggle,
.edit-title-icon {
	cursor: pointer;
	font-size: 1rem;
	padding: 0.3rem;
	border-radius: 4rem;
	background-color: rgba(var(--backgroundPrimary) / 0.5);
	transition: background-color 0.3s ease;
}

.edit-title-icon {
	font-size: 0.5rem;
}

.tag-add-button:hover,
.tag-delete-toggle:hover {
	background-color: rgba(var(--backgroundPrimary) / 0.2);
}

pre {
	white-space: pre-wrap;
}
</style>

<!-- add posted by -->
