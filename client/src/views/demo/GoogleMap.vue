<!-- This needs breaking up but I had a tight deadline and added more features than I was originally planning -->
<script lang="ts" setup>
/// <reference types="google.maps" />
import AddMarkerSwitch from '@/components/demos/map/AddMarkerSwitch.vue'
import GoogleAutocomplete from '@/components/demos/map/GoogleAutocomplete.vue'
import CurrentLocationMarker from '@/components/demos/map/currentLocation.vue'
import { showConfirm, showPrompt } from '@/services/promptModal'
import { notify } from '@/services/toast'
import { useDarkModeStore } from '@/stores/darkModeStore'
import { useMapStore } from '@/stores/mapStore'
import { useMarkerStore } from '@/stores/markerStore'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import { trpc } from '@/trpc'
import { Loader, type LoaderOptions } from '@googlemaps/js-api-loader'
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, ref, useCssModule, watch } from 'vue'

// import zitadelAuth from '@/services/zitadelAuth'
// const user = computed(() => zitadelAuth.oidcAuth.userProfile)

const markerStore = useMarkerStore()

const clearFilter = (tag?: string) => {
	if (tag) {
		markerStore.selectedTags = markerStore.selectedTags.filter(
			(selectedTag) => selectedTag !== tag,
		)
	} else {
		markerStore.selectedTags = []
	}
}

const mapStore = useMapStore()
const darkModeStore = useDarkModeStore()

const sheetStore = useStackableSheetStore()
const { isSheetOpen, sheetContent } = storeToRefs(sheetStore)
const { closeSheet } = sheetStore

const mapsControlsStyle = useCssModule('mapsControls')
// Controls placed on the map sit inside Google's box, which sets its own small font;
// these put the page's font and text size back.
const mapControlClasses = [mapsControlsStyle['spacing']!, 'sf-font-1', 'sf-text-base']

const isTagSelected = (tag: string) => markerStore.selectedTags.includes(tag)

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

watch(isSheetOpen, (open) => {
	if (!open) deleteMode.value = false
})
watch(
	() => darkModeStore.isDarkMode,
	() => renderMap(loader),
)
watch(
	() => mapStore.map,
	async () => {
		await nextTick()
		if (!mapStore.map || !googleAutocomplete.value || !addMarkerSwitch.value) return

		// Add Autocomplete
		const autocompleteEl = googleAutocomplete.value.root
		autocompleteEl.classList.add(...mapControlClasses)
		mapStore.map.controls[google.maps.ControlPosition.TOP_LEFT]?.push(autocompleteEl)

		// Add Marker Switch
		const addMarkerSwitchEl = addMarkerSwitch.value.root
		addMarkerSwitchEl.classList.add(...mapControlClasses)
		mapStore.map.controls[google.maps.ControlPosition.TOP_LEFT]?.push(addMarkerSwitchEl)

		notify({
			duration: 10000,
			variant: 'info',
			message: 'Click the plus button "+" at the top to enter "add marker mode"',
		})
	},
)

const deleteMarker = async (markerContent: {
	mapMarkersId: number
	title: string
	markerInstance: google.maps.marker.AdvancedMarkerElement
}) => {
	const ok = await showConfirm(`Delete the marker "${markerContent.title}"?`, {
		okText: 'Delete',
	})
	if (!ok) return
	const { mapMarkersId: markerId, markerInstance: marker } = markerContent
	try {
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
const directionsUrl = (lat: number, lng: number) => `https://maps.google.com/?q=${lat},${lng}`

// While on, pressing a tag in the sheet deletes it from the marker instead of filtering.
const deleteMode = ref(false)

const toggleDeleteMode = () => {
	deleteMode.value = !deleteMode.value
	if (deleteMode.value)
		notify({
			duration: 10000,
			variant: 'info',
			message:
				'Pressing a tag now deletes it. Press Delete tags again or close the marker to cancel.',
		})
}

const onMarkerTagClick = async (tag: string) => {
	if (deleteMode.value) {
		await deleteTagFromMarker(tag)
		deleteMode.value = false
	} else {
		onTagClick(tag)
	}
}

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

		notify({
			duration: 5000,
			variant: 'success',
			message: 'Title updated successfully!',
		})
	} catch (error) {
		console.error('Error updating title:', error)
		notify({
			duration: 5000,
			variant: 'danger',
			message: 'Failed to update title. Please try again.',
		})
	}
}
</script>

<template>
	<!-- Section above the map -->
	<section class="map-intro sl-inset sf-gap-sm">
		<div class="sl-cluster sl-align-y-center">
			<h3 class="map-intro__title sf-heading-2">
				{{
					markerStore.selectedTags.length
						? `"${markerStore.selectedTags.join(', ')}" markers are being displayed`
						: 'All markers are displayed'
				}}
			</h3>
			<SfButton
				size="xs"
				:loudness="2"
				:disabled="!markerStore.selectedTags.length"
				@click="() => clearFilter()"
			>
				All markers
			</SfButton>
		</div>

		<hr class="sf">
		<div v-if="markerStore.allTags.length" class="sl-cluster sf-gap-xs">
			<SfChip
				v-for="tag in markerStore.allTags"
				:key="tag"
				size="xs"
				:pressed="isTagSelected(tag)"
				@click="onTagClick(tag)"
			>
				{{ tag }}
			</SfChip>
		</div>
	</section>

	<!-- StackableSheet with marker details -->
	<StackableSheet mobile-height="50%" desktop-width="65%" label="Marker details">
		<div v-if="sheetContent?.id === 'mapMarker'" class="sl-stack sf-gap-md">
			<div class="sl-cluster sl-align-y-center sf-gap-xs">
				<h3 class="sf-heading-2">{{ sheetContent.content.title }}</h3>
				<SfIconButton
					icon="edit"
					tooltip="Edit title"
					class="sf-is-contained"
					:loudness="1"
					@click="
						sheetContent?.id === 'mapMarker'
						&& openTitleEditPrompt(sheetContent.content)
					"
				/>
			</div>

			<dl class="sl-split sf-gap-2xs">
				<div class="sl-row">
					<dt>Marker ID</dt>
					<dd>{{ sheetContent.content.mapMarkersId }}</dd>
				</div>
				<div class="sl-row">
					<dt>Latitude</dt>
					<dd>{{ sheetContent.content.lat }}</dd>
				</div>
				<div class="sl-row">
					<dt>Longitude</dt>
					<dd>{{ sheetContent.content.lng }}</dd>
				</div>
			</dl>

			<div class="sl-stack sf-gap-xs">
				<h4 id="marker-tags-heading" class="sf-heading-3">Tags</h4>
				<div
					class="sl-cluster sl-align-y-center sf-gap-xs"
					role="group"
					aria-labelledby="marker-tags-heading"
				>
					<SfChip
						v-for="tag in sheetContent.content.tags"
						:key="tag"
						size="xs"
						:class="deleteMode && 'sf-variant-danger'"
						:pressed="deleteMode ? undefined : isTagSelected(tag)"
						:aria-label="deleteMode ? `Delete tag ${tag}` : undefined"
						@click="onMarkerTagClick(tag)"
					>
						{{ tag }}
					</SfChip>
					<SfIconButton
						icon="plus"
						tooltip="Add tags"
						class="sf-is-contained"
						:loudness="1"
						@click="openAddTagPrompt"
					/>
					<SfIconButton
						v-if="sheetContent.content.tags.length"
						icon="trash"
						tooltip="Delete tags"
						class="sf-is-contained"
						:loudness="1"
						:variant="deleteMode ? 'danger' : undefined"
						:pressed="deleteMode"
						@click="toggleDeleteMode"
					/>
				</div>
			</div>

			<div class="sl-cluster sf-gap-xs">
				<a
					class="sf sf-loudness-3 sf-variant-primary sf-on-hover"
					:href="directionsUrl(sheetContent.content.lat, sheetContent.content.lng)"
					target="_blank"
					rel="noopener"
				>
					Directions
				</a>
				<SfButton
					:loudness="2"
					:disabled="!markerStore.selectedTags.length"
					@click="clearFilter()"
				>
					All markers
				</SfButton>
				<SfButton
					:loudness="2"
					variant="danger"
					@click="sheetContent?.id === 'mapMarker' && deleteMarker(sheetContent.content)"
				>
					Delete marker
				</SfButton>
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

<style module="mapsControls">
/* Room between the map's edge and the controls placed on it. */
.spacing {
	margin: var(--sf-spacing-xs) 0 0 var(--sf-spacing-xs);
}
</style>

<style scoped>
@layer ui {
	.map-intro {
		padding-block: var(--sf-spacing-md);
	}

	/* The title takes the row; the button sits at the end. */
	.map-intro__title {
		flex: 1 1 auto;
	}

	#map {
		height: 100vh;
	}
}
</style>

<!-- add posted by -->
