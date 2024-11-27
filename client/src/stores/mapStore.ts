import { defineStore } from 'pinia'
import { type Ref, ref } from 'vue'

export const useMapStore = defineStore('map', () => {
  const map: Ref<google.maps.Map | null> = ref(null)

  function setMap(newMap: google.maps.Map | null) {
    map.value = newMap
  }

  const userLocation: Ref<google.maps.LatLngLiteral | null> = ref(null)

  function setUserLocation(newLocation: google.maps.LatLngLiteral | null) {
    userLocation.value = newLocation
  }

  function centerMapOnUser() {
    if (map.value && userLocation.value) {
      map.value.setCenter(userLocation.value)
    }
  }

  return { map, setMap, userLocation, setUserLocation, centerMapOnUser }
})
