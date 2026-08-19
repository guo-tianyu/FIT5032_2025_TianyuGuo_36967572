<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import L from 'leaflet'
import {
  calculateDrivingRoute,
  requestCurrentLocation,
  searchAustralianPlaces
} from '@/services/map'

const mapElement = ref(null)
const origin = reactive({ query: '', results: [], selected: null, error: '', loading: false })
const destination = reactive({ query: '', results: [], selected: null, error: '', loading: false })
const locationError = ref('')
const routeError = ref('')
const isLocating = ref(false)
const isRouting = ref(false)
const trip = ref(null)

let map
let originMarker
let destinationMarker
let accuracyCircle
let routeLine
let originSearchController
let destinationSearchController
let routeController

const canPlanRoute = computed(() => Boolean(origin.selected && destination.selected) && !isRouting.value)
const formattedDistance = computed(() => trip.value ? `${trip.value.distanceKilometres.toFixed(1)} km` : '')
const formattedDuration = computed(() => {
  if (!trip.value) return ''
  const totalMinutes = Math.max(1, Math.round(trip.value.durationMinutes))
  if (totalMinutes < 60) return `${totalMinutes} min`

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours} hr${hours === 1 ? '' : 's'}${minutes ? ` ${minutes} min` : ''}`
})

function stateFor(type) {
  return type === 'origin' ? origin : destination
}

function setSearchController(type, controller) {
  if (type === 'origin') {
    originSearchController?.abort()
    originSearchController = controller
  } else {
    destinationSearchController?.abort()
    destinationSearchController = controller
  }
}

async function searchPlaces(type) {
  const state = stateFor(type)
  const query = state.query.trim()
  state.error = ''
  state.results = []

  if (!query) {
    state.error = type === 'origin'
      ? 'Enter an Australian starting point.'
      : 'Enter an Australian health service, suburb, postcode or address.'
    return
  }

  const controller = new AbortController()
  setSearchController(type, controller)
  state.loading = true
  try {
    state.results = await searchAustralianPlaces(query, controller.signal)
    if (!state.results.length) {
      state.error = 'No Australian places matched your search. Try a more specific name or address.'
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      state.error = 'We could not search for places right now. Check your connection and try again.'
    }
  } finally {
    if (!controller.signal.aborted) state.loading = false
  }
}

function popupContent(label, placeName) {
  const wrapper = document.createElement('div')
  const heading = document.createElement('strong')
  const text = document.createElement('span')
  heading.textContent = label
  text.textContent = placeName
  wrapper.append(heading, document.createElement('br'), text)
  return wrapper
}

function showPlaceOnMap(place, type) {
  const isOrigin = type === 'origin'
  const colour = isOrigin ? '#24594d' : '#a64f3b'
  const marker = L.circleMarker([place.latitude, place.longitude], {
    radius: 9,
    color: '#ffffff',
    weight: 3,
    fillColor: colour,
    fillOpacity: 1
  }).addTo(map)
  marker.bindPopup(popupContent(isOrigin ? 'Starting point' : 'Destination', place.name))

  if (isOrigin) {
    originMarker?.remove()
    originMarker = marker
  } else {
    destinationMarker?.remove()
    destinationMarker = marker
  }

  map.setView([place.latitude, place.longitude], 14)
  marker.openPopup()
}

function selectPlace(type, place) {
  const state = stateFor(type)
  state.selected = place
  state.query = place.name
  state.results = []
  state.error = ''
  locationError.value = ''
  clearRoute()

  if (type === 'origin') {
    accuracyCircle?.remove()
    accuracyCircle = null
  }
  showPlaceOnMap(place, type)
  fitSelectedPlaces()
}

function fitSelectedPlaces() {
  if (!origin.selected || !destination.selected) return
  map.fitBounds([
    [origin.selected.latitude, origin.selected.longitude],
    [destination.selected.latitude, destination.selected.longitude]
  ], { padding: [48, 48], maxZoom: 15 })
}

async function useCurrentLocation() {
  locationError.value = ''
  isLocating.value = true
  try {
    const place = await requestCurrentLocation()
    origin.selected = place
    origin.query = place.name
    origin.results = []
    origin.error = ''
    clearRoute()
    showPlaceOnMap(place, 'origin')
    accuracyCircle?.remove()
    accuracyCircle = L.circle([place.latitude, place.longitude], {
      radius: place.accuracyMetres,
      color: '#24594d',
      fillColor: '#4f887a',
      fillOpacity: 0.12,
      weight: 1
    }).addTo(map)
    fitSelectedPlaces()
  } catch (error) {
    locationError.value = error.message
  } finally {
    isLocating.value = false
  }
}

async function planRoute() {
  if (!canPlanRoute.value) return

  routeController?.abort()
  routeController = new AbortController()
  clearRoute(false)
  isRouting.value = true
  try {
    trip.value = await calculateDrivingRoute(
      origin.selected,
      destination.selected,
      routeController.signal
    )
    routeLine = L.polyline(trip.value.coordinates, {
      color: '#2b6cb0',
      weight: 5,
      opacity: 0.85
    }).addTo(map)
    map.fitBounds(routeLine.getBounds(), { padding: [48, 48] })
  } catch (error) {
    if (error.name !== 'AbortError') {
      routeError.value = error.message.includes('No driving route')
        ? error.message
        : 'We could not calculate the route right now. Check your connection and try again.'
    }
  } finally {
    if (!routeController.signal.aborted) isRouting.value = false
  }
}

function clearRoute(abortRequest = true) {
  if (abortRequest) routeController?.abort()
  routeLine?.remove()
  routeLine = null
  trip.value = null
  routeError.value = ''
  isRouting.value = false
}

onMounted(async () => {
  await nextTick()
  map = L.map(mapElement.value, {
    scrollWheelZoom: false,
    zoomControl: true
  }).setView([-37.8136, 144.9631], 11)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)
})

onBeforeUnmount(() => {
  originSearchController?.abort()
  destinationSearchController?.abort()
  routeController?.abort()
  map?.remove()
})
</script>

<template>
  <section class="find-help-hero">
    <div class="container py-5">
      <p class="eyebrow">Find support nearby</p>
      <h1>Search a place and plan your journey</h1>
      <p>Find an Australian health or support destination, choose where to start, and view an estimated driving route.</p>
    </div>
  </section>

  <section class="container section-space" aria-labelledby="journey-planner-heading">
    <div class="map-layout">
      <aside class="map-controls">
        <div>
          <h2 id="journey-planner-heading">Journey planner</h2>
          <p class="privacy-note">Your location is requested only when you select “Use my location”. StudyWell Connect does not store it.</p>
        </div>

        <form class="place-search" role="search" @submit.prevent="searchPlaces('origin')">
          <label for="origin-query">Starting point</label>
          <div class="search-row">
            <input
              id="origin-query"
              v-model="origin.query"
              class="form-control"
              type="search"
              placeholder="e.g. Clayton VIC 3168"
              autocomplete="street-address"
              :aria-describedby="origin.error ? 'origin-error' : 'origin-hint'"
            >
            <button class="btn btn-brand" type="submit" :disabled="origin.loading">
              {{ origin.loading ? 'Searching…' : 'Search' }}
            </button>
          </div>
          <small id="origin-hint">Search for an Australian address, suburb or postcode.</small>
          <p v-if="origin.error" id="origin-error" class="map-message error-message" role="alert">{{ origin.error }}</p>
        </form>

        <div v-if="origin.results.length" class="search-results" aria-labelledby="origin-results-heading">
          <h3 id="origin-results-heading">Starting point results</h3>
          <ul>
            <li v-for="place in origin.results" :key="place.id">
              <button type="button" @click="selectPlace('origin', place)">
                <span>{{ place.name }}</span><small>Select starting point</small>
              </button>
            </li>
          </ul>
        </div>

        <div class="choice-divider" aria-hidden="true"><span>or</span></div>
        <button class="btn btn-outline-brand w-100" type="button" :disabled="isLocating" @click="useCurrentLocation">
          {{ isLocating ? 'Finding your location…' : 'Use my location' }}
        </button>
        <p v-if="locationError" class="map-message error-message" role="alert">{{ locationError }}</p>
        <p v-else-if="origin.selected?.id === 'current-location'" class="map-message success-message" role="status">
          Location found with approximately {{ Math.round(origin.selected.accuracyMetres) }} metre accuracy.
        </p>

        <form class="place-search destination-search" role="search" @submit.prevent="searchPlaces('destination')">
          <label for="destination-query">Health service or destination</label>
          <div class="search-row">
            <input
              id="destination-query"
              v-model="destination.query"
              class="form-control"
              type="search"
              placeholder="e.g. Monash Medical Centre"
              autocomplete="off"
              :aria-describedby="destination.error ? 'destination-error' : 'destination-hint'"
            >
            <button class="btn btn-brand" type="submit" :disabled="destination.loading">
              {{ destination.loading ? 'Searching…' : 'Search' }}
            </button>
          </div>
          <small id="destination-hint">Search for a health service, suburb, postcode or full address.</small>
          <p v-if="destination.error" id="destination-error" class="map-message error-message" role="alert">{{ destination.error }}</p>
        </form>

        <div v-if="destination.results.length" class="search-results" aria-labelledby="destination-results-heading">
          <h3 id="destination-results-heading">Destination results</h3>
          <ul>
            <li v-for="place in destination.results" :key="place.id">
              <button type="button" @click="selectPlace('destination', place)">
                <span>{{ place.name }}</span><small>Select destination</small>
              </button>
            </li>
          </ul>
        </div>

        <div class="route-actions">
          <button class="btn btn-brand w-100" type="button" :disabled="!canPlanRoute" @click="planRoute">
            {{ isRouting ? 'Calculating route…' : 'Plan journey' }}
          </button>
          <p v-if="!origin.selected || !destination.selected" class="route-hint">Select both a starting point and destination to plan your journey.</p>
          <p v-if="routeError" class="map-message error-message" role="alert">{{ routeError }}</p>
        </div>

        <div class="trip-summary" aria-live="polite" :aria-busy="isRouting">
          <template v-if="trip">
            <h3>Estimated trip</h3>
            <dl>
              <div><dt>Distance</dt><dd>{{ formattedDistance }}</dd></div>
              <div><dt>Driving time</dt><dd>{{ formattedDuration }}</dd></div>
            </dl>
            <small>Estimates are provided by OSRM and may differ from current road conditions.</small>
          </template>
        </div>
      </aside>

      <div class="map-panel">
        <div
          ref="mapElement"
          class="help-map"
          role="region"
          aria-label="Interactive map showing the selected starting point, destination and driving route"
        ></div>
        <p class="map-key">
          <span class="key-dot origin-dot" aria-hidden="true"></span> Starting point
          <span class="key-dot destination-dot" aria-hidden="true"></span> Destination
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.find-help-hero {
  background: #eef4f1;
  border-bottom: 1px solid #d7e1de;
}

.find-help-hero h1 {
  max-width: 760px;
  margin: 0 0 16px;
  font-size: clamp(34px, 5vw, 48px);
}

.find-help-hero p:last-child {
  max-width: 760px;
  margin: 0;
  color: #536b65;
  font-size: 18px;
  line-height: 1.65;
}

.map-layout {
  display: grid;
  grid-template-columns: minmax(300px, 400px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.map-controls,
.map-panel {
  background: #fff;
  border: 1px solid #d6dfdc;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(18, 59, 58, 0.07);
}

.map-controls {
  padding: 24px;
}

.map-controls h2 {
  margin: 0 0 8px;
  font-size: 26px;
}

.privacy-note,
.route-hint {
  color: #5e716c;
  line-height: 1.5;
}

.place-search {
  margin-top: 24px;
}

.destination-search {
  padding-top: 22px;
  border-top: 1px solid #e0e7e5;
}

.place-search label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

.search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
}

.search-row .form-control {
  border-radius: 4px 0 0 4px;
}

.search-row .btn {
  border-radius: 0 4px 4px 0;
}

.place-search > small {
  display: block;
  margin-top: 7px;
  color: #657873;
}

.search-results {
  margin-top: 18px;
}

.search-results h3,
.trip-summary h3 {
  font-size: 18px;
}

.search-results ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-results li + li {
  margin-top: 8px;
}

.search-results button {
  width: 100%;
  padding: 10px 12px;
  color: #253b36;
  background: #f7f9f8;
  border: 1px solid #d6dfdc;
  border-radius: 6px;
  text-align: left;
}

.search-results button:hover,
.search-results button:focus-visible {
  background: #e7f1ed;
  border-color: #4f887a;
}

.search-results button span,
.search-results button small {
  display: block;
}

.search-results button span {
  line-height: 1.35;
}

.search-results button small {
  margin-top: 4px;
  color: #526d66;
  font-weight: 700;
}

.choice-divider {
  margin: 18px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #71827e;
  font-size: 13px;
  text-transform: uppercase;
}

.choice-divider::before,
.choice-divider::after {
  height: 1px;
  flex: 1;
  content: '';
  background: #e0e7e5;
}

.route-actions,
.trip-summary {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e0e7e5;
}

.route-actions .route-hint {
  margin: 10px 0 0;
  font-size: 14px;
}

.map-message {
  margin: 10px 0 0;
  line-height: 1.45;
}

.error-message {
  color: #9b2c2c;
}

.success-message {
  color: #246144;
}

.trip-summary:empty {
  display: none;
}

.trip-summary dl {
  margin: 14px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.trip-summary dl div {
  padding: 12px;
  background: #eef4f1;
  border-radius: 6px;
}

.trip-summary dt {
  color: #5e716c;
  font-size: 13px;
}

.trip-summary dd {
  margin: 3px 0 0;
  color: #123b3a;
  font-size: 20px;
  font-weight: 700;
}

.trip-summary small {
  color: #657873;
  line-height: 1.4;
}

.map-panel {
  overflow: hidden;
}

.help-map {
  width: 100%;
  height: 680px;
  background: #dce7e3;
}

.map-key {
  margin: 0;
  padding: 12px 16px;
  color: #526761;
  background: #fff;
  font-size: 13px;
}

.key-dot {
  width: 11px;
  height: 11px;
  margin: 0 5px 0 14px;
  display: inline-block;
  border-radius: 50%;
}

.key-dot:first-child {
  margin-left: 0;
}

.origin-dot {
  background: #24594d;
}

.destination-dot {
  background: #a64f3b;
}

:deep(.leaflet-control-zoom a:focus-visible) {
  outline: 3px solid #e0ad35;
  outline-offset: 2px;
}

@media (max-width: 991px) {
  .map-layout {
    grid-template-columns: 1fr;
  }

  .help-map {
    height: 500px;
  }
}

@media (max-width: 575px) {
  .map-controls {
    padding: 18px;
  }

  .search-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .search-row .form-control,
  .search-row .btn {
    width: 100%;
    border-radius: 4px;
  }

  .help-map {
    height: 400px;
  }
}
</style>
