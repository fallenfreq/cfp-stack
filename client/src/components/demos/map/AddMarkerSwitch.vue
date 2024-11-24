<script setup lang="ts">
import { onMounted, ref, type Ref, watch, toRaw } from 'vue'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { trpc } from '@/trpc'
import { /*useMutation,*/ useQuery } from '@tanstack/vue-query'
import { useStackableSheetStore } from '@/stores/sheetStore'
import { useToast } from 'vuestic-ui'

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
const root = ref<HTMLElement | null>(null)
const props = defineProps<{
  map: google.maps.Map
}>()

defineExpose({
  root
})

// We could use a reactive object to store markers and render them on the map based on ref value
// for now they all load on page load and are deleted if the delete button is clicked
const liveMarkers: Record<number, google.maps.marker.AdvancedMarkerElement> = {}

// State to track if we're in "add marker mode"
const isAddingMarkers = ref(false)
const addListenerRef = ref<google.maps.MapsEventListener | null>(null)

// The queryKey should be text included in a tag or the title of a marker
const selectMarkers = (search?: string | number | google.maps.LatLngLiteral) => {
  return useQuery({
    queryKey: ['selectMarkers', search],
    queryFn: () => trpc.mapMarker.select.query({ search })
  })
}

// Mutation to send marker data to the server
// const {
//   // data,
//   mutate: insertMarkerToDb
//   // isPending,
//   // isError,
//   // error,
//   // isSuccess,
// } = useMutation({
//   mutationFn: (payload: Parameters<typeof trpc.mapMarker.insert.mutate>[0]) =>
//     trpc.mapMarker.insert.mutate(payload),
//   onSuccess: () => {
//     console.log('Marker added successfully')
//   },
//   onError: (error) => {
//     console.error('Error adding marker:', error)
//   }
// })

// tanstack wont work in the click handler so using trpc directly
const onMarkerClick = async (mapsMouseEvent: google.maps.MapMouseEvent) => {
  const data = await trpc.mapMarker.select.query({ search: mapsMouseEvent?.latLng?.toJSON() })
  const marker: google.maps.marker.AdvancedMarkerElement = liveMarkers[data[0].mapMarkersId]
  sheetStore.openSheet({ content: data[0], marker })
}

// Function to handle adding a marker
const handleMapClick = async (event: google.maps.MapMouseEvent) => {
  if (!event.latLng) return
  const latLng = event.latLng

  // Open dialog/modal for user input (stubbed here)
  const title = prompt('Enter a title for the marker:')
  if (!title) {
    console.warn('Marker creation canceled.')
    return
  }
  const tags = prompt('Enter tags for the marker (comma-separated):')?.split(',') || []

  // Insert the marker into the database
  // await insertMarkerToDb({ lat: latLng.lat(), lng: latLng.lng(), title, tags })
  const { marker } = await trpc.mapMarker.insert.mutate({
    lat: latLng.lat(),
    lng: latLng.lng(),
    title,
    tags
  })

  // Add the marker to the map
  const { AdvancedMarkerElement } = (await google.maps.importLibrary(
    'marker'
  )) as google.maps.MarkerLibrary
  const markerEl = new AdvancedMarkerElement({
    map: toRaw(props.map),
    position: { lat: latLng.lat(), lng: latLng.lng() },
    // REQUIRED, OPTIONAL_AND_HIDES_LOWER_PRIORITY, REQUIRED_AND_HIDES_OPTIONAL
    collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior,
    title,
    gmpClickable: true
  })
  markerEl.addListener('click', onMarkerClick)
  liveMarkers[marker.mapMarkersId] = markerEl
  toggleAddingMarkers()
}

// Function to toggle marker adding mode
const toggleAddingMarkers = () => {
  isAddingMarkers.value = !isAddingMarkers.value

  if (isAddingMarkers.value) {
    addListenerRef.value = props.map.addListener('click', handleMapClick)
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

const renderMarkers = async (
  markers: Ref<undefined | Awaited<ReturnType<typeof trpc.mapMarker.select.query>>>
) => {
  const { AdvancedMarkerElement } = (await google.maps.importLibrary(
    'marker'
  )) as google.maps.MarkerLibrary

  if (markers.value) {
    for (const markerData of markers.value) {
      // To remove a marker from the map, set either markerEl.map or position to null.
      const markerEl = new AdvancedMarkerElement({
        map: toRaw(props.map),
        position: { lat: markerData.lat, lng: markerData.lng },
        // REQUIRED, OPTIONAL_AND_HIDES_LOWER_PRIORITY, REQUIRED_AND_HIDES_OPTIONAL
        collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior,
        title: markerData.title,
        gmpClickable: true
      })
      markerEl.addListener('click', onMarkerClick)
      liveMarkers[markerData.mapMarkersId] = markerEl
    }
  }
}

const { data: markers } = selectMarkers()

onMounted(async () => {
  watch(markers, () => renderMarkers(markers))
})
</script>

<template>
  <button
    ref="root"
    @click="toggleAddingMarkers"
    class="add-marker-button"
    :style="{ color: isAddingMarkers ? 'rgb(var(--primary))' : 'inherit' }"
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
