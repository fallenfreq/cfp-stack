import { defineStore } from 'pinia'
import { type Ref, ref } from 'vue'

export const useMapStore = defineStore('map', () => {
  const map: Ref<google.maps.Map | null> = ref(null)

  function setMap(newMap: google.maps.Map | null) {
    map.value = newMap
  }

  return { map, setMap }
})
