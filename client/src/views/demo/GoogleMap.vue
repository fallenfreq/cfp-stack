<script lang="ts" setup>
import { Loader, type LoaderOptions } from '@googlemaps/js-api-loader'
import { ref, onMounted, useCssModule, watch, nextTick } from 'vue'
import GoogleAutocomplete from '@/components/demos/map/GoogleAutocomplete.vue'
import AddMarkerSwitch from '@/components/demos/map/AddMarkerSwitch.vue'
import { useDarkModeStore } from '@/stores/darkModeStore'
import { useStackableSheetStore } from '@/stores/sheetStore'
import { trpc } from '@/trpc'
import { useToast } from 'vuestic-ui'

const darkModeStore = useDarkModeStore()
const sheetStore = useStackableSheetStore<{
  marker: google.maps.marker.AdvancedMarkerElement
  content: {
    mapMarkersId: number
    title: string
    lat: number
    lng: number
    tags: string[]
  }
}>()
const mapsControlsStyle = useCssModule('mapsControls')

// Define Blackpool's coordinates.
const blackpool: google.maps.LatLngLiteral = {
  lat: 53.8175053,
  lng: -3.0356748
}

// Map container reference
const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<google.maps.Map | null>(null)

// Refs for controls
const googleAutocomplete = ref<typeof GoogleAutocomplete | null>(null)
const addMarkerSwitch = ref<typeof AddMarkerSwitch | null>(null)

// Initialize the Google Maps loader
const loaderOptions: LoaderOptions = {
  apiKey: import.meta.env.VITE_API_GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places', 'marker']
}
const loader = new Loader(loaderOptions)
const renderMap = async () => {
  if (!mapContainer.value) {
    console.error('Map container ref not found')
    throw new Error('Map container ref not found')
  }

  const { Map } = await loader.importLibrary('maps')

  // https://developers.google.com/maps/documentation/javascript/reference/control
  const mapControls = {
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: window.google.maps.ControlPosition.INLINE_END_BLOCK_END
    },
    zoomControl: true,
    zoomControlOptions: {
      position: window.google.maps.ControlPosition.LEFT_CENTER
    },
    scaleControl: true,
    streetViewControl: true,
    streetViewControlOptions: {
      position: window.google.maps.ControlPosition.LEFT_CENTER
    },
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: window.google.maps.ControlPosition.BLOCK_START_INLINE_END
    }
  }

  // @ts-expect-error: ColorScheme is not typed in the @types/googlemaps library
  const { ColorScheme } = await google.maps.importLibrary('core')

  // Map options
  const mapOptions: google.maps.MapOptions = {
    center: blackpool,
    zoom: 11,
    mapId: 'DEMO_MAP_ID',
    colorScheme: darkModeStore.isDarkMode ? ColorScheme.DARK : ColorScheme.LIGHT,
    ...mapControls
  }
  map.value = new Map(mapContainer.value, mapOptions)
}

onMounted(renderMap)
watch(() => darkModeStore.isDarkMode, renderMap)
watch(map, async () => {
  await nextTick()
  if (!map.value || !googleAutocomplete.value || !addMarkerSwitch.value) return

  // Add Autocomplete
  const autocompleteEl = googleAutocomplete.value.root
  autocompleteEl.classList.add(mapsControlsStyle['spacing'])
  map.value.controls[google.maps.ControlPosition.TOP_LEFT].push(autocompleteEl)

  // Add Marker Switch
  const addMarkerSwitchEl = addMarkerSwitch.value.root
  addMarkerSwitchEl.classList.add(mapsControlsStyle['spacing'])
  map.value.controls[google.maps.ControlPosition.TOP_LEFT].push(addMarkerSwitchEl)

  useToast().notify({
    duration: 10000,
    color: 'info',
    position: 'bottom-right',
    message: 'Click the plus button "+" at the top to enter "add marker mode"'
  })
})

// pass it the marker instance somehow
const deleteMarker = async (
  event: MouseEvent,
  marker: google.maps.marker.AdvancedMarkerElement
) => {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return
  const { toDeleteId } = event.currentTarget.dataset
  if (!toDeleteId) return
  try {
    await trpc.mapMarker.delete.mutate(parseInt(toDeleteId))
    // Remove the marker from the map
    marker.position = null
    marker.map = null
    sheetStore.closeSheet()
  } catch (error) {
    console.error('Error deleting marker:', error)
  }
}
</script>

<template>
  <StackableSheet mobileHeight="50%" desktopWidth="65%" @close="sheetStore.closeSheet">
    <div v-if="sheetStore.sheetContent?.content">
      <h2 class="text-3xl font-bold">Marker details</h2>
      <br />
      <pre>
Title: {{ sheetStore.sheetContent.content.title }}
Marker ID: {{ sheetStore.sheetContent.content.mapMarkersId }}
Latitude: {{ sheetStore.sheetContent.content.lat }}
Longitude: {{ sheetStore.sheetContent.content.lng }}
      </pre>
      <div>
        <VaChip
          outline
          v-for="(tag, index) in sheetStore.sheetContent.content.tags"
          :key="index"
          size="small"
          class="mr-2 mb-8"
          @click="console.log('Filter by tag:', tag)"
          >{{ tag }}</VaChip
        >
      </div>
      <!-- get directions to coordinates -->
      <!-- make tags into pils that can be clicked to filter search the marckers -->
      <VaButton
        :data-to-delete-id="sheetStore.sheetContent.content.mapMarkersId"
        color="primary"
        @click="
          (event: MouseEvent) =>
            sheetStore.sheetContent && deleteMarker(event, sheetStore.sheetContent.marker)
        "
        >Delete marker</VaButton
      >
    </div>
  </StackableSheet>
  <div ref="mapContainer" id="map"></div>
  <div style="display: block">
    <GoogleAutocomplete v-if="map" :map="map" ref="googleAutocomplete" />
    <AddMarkerSwitch v-if="map" :map="map" ref="addMarkerSwitch" />
  </div>
</template>

<style module="mapsControls">
.spacing {
  margin: 10px 0 0 10px;
}
</style>

<style scoped>
#map {
  height: 100vh;
}
</style>
