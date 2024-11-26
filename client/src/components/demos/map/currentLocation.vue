<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, toRaw } from 'vue'
import { useMapStore } from '@/stores/mapStore'

const mapStore = useMapStore()
const customPin = ref<HTMLDivElement | null>(null)

if (!mapStore.map) {
  throw new Error('Map not found in store.')
}

let currentLocationMarker: google.maps.marker.AdvancedMarkerElement | null = null
const pollingInterval = ref<number | null>(null)
const deviceHeading = ref<number | null>(null) // To store the device's heading

// Function to update the triangle's rotation
const updateTriangleRotation = (heading: number): void => {
  if (customPin.value) {
    customPin.value.style.transform = `rotate(${heading}deg)`
  }
}

// Device Orientation API setup
const onDeviceOrientation = (event: DeviceOrientationEvent) => {
  if (event.absolute && event.alpha !== null) {
    deviceHeading.value = event.alpha // Heading in degrees
    updateTriangleRotation(deviceHeading.value)
  } else {
    deviceHeading.value = null // No heading data available
  }
}

// Function to create or update the marker
const updateLocationMarker = async () => {
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

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
          position: currentPosition,
          map: toRaw(mapStore.map),
          title: 'Current Location',
          content: pin
        })
      } else {
        // Update marker position
        currentLocationMarker.position = currentPosition
      }
    },
    (error) => {
      console.error('Error fetching location:', error.message)
    }
  )
}

// Set up polling to update location every few seconds
onMounted(() => {
  updateLocationMarker() // Initial fetch
  pollingInterval.value = window.setInterval(updateLocationMarker, 5000)
  // Listen for device orientation
  window.addEventListener('deviceorientation', onDeviceOrientation)
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

  // Remove device orientation listener
  window.removeEventListener('deviceorientation', onDeviceOrientation)
})
const topNeeded = deviceHeading.value ? '-1px' : 'auto'
</script>

<template>
  <div ref="customPin" class="custom-pin">
    <!-- Render the triangle only if heading is available -->
    <div v-if="deviceHeading !== null" class="triangle"></div>
    <!-- Render the circle if heading is not available -->
    <div v-else class="circle"></div>
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

.triangle {
  --r: 2px; /* border radius */
  width: 25px;
  aspect-ratio: 1 / cos(30deg);
  --_g: calc(tan(60deg) * var(--r)) bottom var(--r), #000 98%, #0000 101%;
  mask:
    /* a conic gradient to fill the middle area */
    conic-gradient(from -30deg at 50% calc(200% - 3 * var(--r) / 2), #000 60deg, #0000 0) 0 100%/100%
      calc(100% - 3 * var(--r) / 2) no-repeat,
    /* 3 radial gradients for 3 circles */
      radial-gradient(var(--r) at 50% calc(2 * var(--r)), #000 98%, #0000 101%),
    radial-gradient(var(--r) at left var(--_g)),
    radial-gradient(var(--r) at right var(--_g));
  /* the 3-point polygon */
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  background-color: rgba(var(--primary) / 1);
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
  top: v-bind(topNeeded);
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
