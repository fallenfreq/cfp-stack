<script setup lang="ts">
import { useMapStore } from '@/stores/mapStore'
import { onMounted, ref } from 'vue'
const root = ref<HTMLElement | null>(null)
const props = defineProps<{ map: google.maps.Map }>()

const mapStore = useMapStore()

defineExpose({
	root,
})

let token: google.maps.places.AutocompleteSessionToken | null = null

const input = ref('')
const results = ref<{ text: string; place: google.maps.places.Place }[]>([])
const showDropdown = ref(false)

const request: google.maps.places.AutocompleteRequest = {
	input: '',
	locationBias: {
		center: props.map.getCenter() || mapStore.userLocation || mapStore.defaultCenter,
		radius: 500.0,
	},
	includedPrimaryTypes: ['(regions)'],
}

async function init() {
	token = new google.maps.places.AutocompleteSessionToken()
	refreshToken()
}

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
			place: suggestion.placePrediction!.toPlace(),
		}))

		showDropdown.value = results.value.length > 0
	} catch (error) {
		console.error('Error fetching autocomplete suggestions:', error)
		results.value = []
		showDropdown.value = false
	}
}

async function onPlaceSelected(place: google.maps.places.Place) {
	try {
		await place.fetchFields({
			fields: ['location'],
		})

		const location = place.location as google.maps.LatLng
		console.log(`Selected place coordinates: Lat=${location.lat()}, Lng=${location.lng()}`)
		props.map.setCenter({ lat: location.lat(), lng: location.lng() })

		input.value = ''
		results.value = []
		showDropdown.value = false
		const locationBias = request.locationBias as google.maps.CircleLiteral
		locationBias.center = props.map.getCenter() || mapStore.defaultCenter
	} catch (error) {
		console.error('Error selecting place:', error)
	}
}

async function refreshToken() {
	token = new google.maps.places.AutocompleteSessionToken()
	request.sessionToken = token
}

onMounted(() => {
	init()
})
</script>

<template>
	<div ref="root" class="place-search">
		<input
			v-model="input"
			type="search"
			placeholder="Go to a place..."
			aria-label="Go to a place"
			class="sf sf-field"
			@input="makeAcRequest"
		/>
		<ul v-if="showDropdown" class="place-search__results sl-stack sf-gap-none sf-depth-2">
			<li v-for="(result, index) in results" :key="index">
				<SfButton
					class="place-search__result sf-is-contained"
					@click="onPlaceSelected(result.place)"
				>
					{{ result.text }}
				</SfButton>
			</li>
		</ul>
	</div>
</template>

<style scoped>
@layer ui {
	/* The results hang below the field over the map. */
	.place-search {
		position: relative;
		z-index: 1; /* results cover the controls stacked below it */
	}

	.place-search > input {
		width: 100%;
	}

	.place-search__results {
		position: absolute;
		inset-inline: 0;
		overflow: hidden;
	}

	/* Full-width rows: the list stretches them; text starts at the left and may wrap. */
	.place-search__result {
		justify-content: start;
		white-space: normal;
		text-align: start;
	}
}
</style>
