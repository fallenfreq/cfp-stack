<script setup lang="ts">
import { ref, onMounted } from 'vue'
const root = ref<HTMLElement | null>(null)
const props = defineProps<{ map: google.maps.Map }>()

defineExpose({
  root
})

let token: google.maps.places.AutocompleteSessionToken | null = null

// Define Blackpool's coordinates.
const blackpool: google.maps.LatLngLiteral = {
  lat: 53.8175053,
  lng: -3.0356748
}

// Reactive variables for managing input, results, and request data.
const input = ref('')
const results = ref<{ text: string; place: google.maps.places.Place }[]>([])
const showDropdown = ref(false)

const request: google.maps.places.AutocompleteRequest = {
  input: '',
  locationBias: {
    center: props.map.getCenter() || blackpool,
    radius: 500.0
  },
  includedPrimaryTypes: ['(regions)']
}

// Function to initialize the session token.
async function init() {
  token = new google.maps.places.AutocompleteSessionToken()
  refreshToken()
}

// Function to handle input changes and fetch autocomplete suggestions.
async function makeAcRequest() {
  if (!input.value.trim()) {
    results.value = []
    showDropdown.value = false
    return
  }

  request.input = input.value

  try {
    const { suggestions } =
      await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)

    results.value = suggestions.map((suggestion) => ({
      text: suggestion.placePrediction!.text.toString(),
      place: suggestion.placePrediction!.toPlace()
    }))

    showDropdown.value = results.value.length > 0
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error)
    results.value = []
    showDropdown.value = false
  }
}

// Function to handle the selection of a place.
async function onPlaceSelected(place: google.maps.places.Place) {
  try {
    await place.fetchFields({
      fields: ['location']
    })

    const location = place.location as google.maps.LatLng
    console.log(`Selected place coordinates: Lat=${location.lat()}, Lng=${location.lng()}`)
    props.map.setCenter({ lat: location.lat(), lng: location.lng() })

    // Reset input and dropdown.
    input.value = ''
    results.value = []
    showDropdown.value = false
    const locationBias = request.locationBias as google.maps.CircleLiteral
    locationBias.center = props.map.getCenter() || blackpool
  } catch (error) {
    console.error('Error selecting place:', error)
  }
}

// Helper function to refresh the session token.
async function refreshToken() {
  token = new google.maps.places.AutocompleteSessionToken()
  request.sessionToken = token
}

onMounted(() => {
  init()
})
</script>

<template>
  <div ref="root">
    <input
      type="text"
      v-model="input"
      @input="makeAcRequest"
      placeholder="Go to a place..."
      class="input-field"
    />
    <ul v-if="showDropdown" class="dropdown-menu">
      <li
        v-for="(result, index) in results"
        :key="index"
        @click="onPlaceSelected(result.place)"
        class="dropdown-item"
      >
        {{ result.text }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.input-field {
  width: 100%;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid rgb(var(--backgroundBorder));
  background-color: rgb(var(--backgroundSecondary));
  border-radius: 4px;
}

.dropdown-menu {
  list-style-type: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgb(var(--backgroundBorder));
  border-radius: 4px;
  background: rgb(var(--backgroundPrimary));
  position: absolute;
  width: 100%;
  z-index: 1000;
}

.dropdown-item {
  padding: 8px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: rgb(var(--backgroundSecondary));
}
</style>
