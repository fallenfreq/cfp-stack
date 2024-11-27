<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, toRaw, watch } from 'vue'
import { useMapStore } from '@/stores/mapStore'

const mapStore = useMapStore()
const customPin = ref<HTMLDivElement | null>(null)

if (!mapStore.map) {
  throw new Error('Map not found in store.')
}

let currentLocationMarker: google.maps.marker.AdvancedMarkerElement | null = null
const pollingInterval = ref<number | null>(null)

// Function to create or update the marker
const updateLocationMarker = () => {
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const newPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
      mapStore.setUserLocation(newPosition)
      if (!currentLocationMarker) {
        const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary
        const pin =
          customPin.value ||
          new PinElement({
            scale: 0.8,
            glyph: 'U',
            glyphColor: 'black',
            background: 'yellow'
          }).element
        currentLocationMarker = new AdvancedMarkerElement({
          position: newPosition,
          map: toRaw(mapStore.map),
          title: 'Current Location',
          content: pin
        })
      } else {
        currentLocationMarker.position = newPosition
      }
    },
    (error) => {
      console.error('Error fetching location:', error.message)
    }
  )
}

watch(
  () => mapStore.map,
  () => {
    console.log('Map changed:', mapStore.map)
    if (currentLocationMarker && mapStore.map) {
      currentLocationMarker.map = toRaw(mapStore.map)
    }
  }
)

onMounted(async () => {
  updateLocationMarker()
  // Watch for user the first time user location is set to move the map
  const stopWatching = watch(
    () => mapStore.userLocation,
    () => {
      if (mapStore.userLocation) mapStore.map?.setCenter(mapStore.userLocation)
      stopWatching()
    }
  )
  // Start polling for location updates
  pollingInterval.value = window.setInterval(updateLocationMarker, 3000)
})

// Cleanup on unmount
onBeforeUnmount(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
  if (currentLocationMarker) {
    currentLocationMarker.map = null
    currentLocationMarker = null
  }
})
</script>

<template>
  <div ref="customPin" class="custom-pin">
    <!-- Render the circle if heading is not available -->
    <div class="circle"></div>
    <!-- Pulsating background remains for both -->
    <div class="pulsating-circle"></div>
  </div>
</template>

<style scoped>
.custom-pin {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
}

.circle {
  width: 20px;
  height: 20px;
  background-color: rgba(var(--primary) / 1);
  border-radius: 50%;
}

.pulsating-circle {
  width: 30px;
  height: 30px;
  background-color: rgba(var(--primary) / 0.3);
  border-radius: 50%;
  position: absolute;
  animation: pulsate 2s infinite ease-in-out;
  z-index: -1;
}

@keyframes pulsate {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
