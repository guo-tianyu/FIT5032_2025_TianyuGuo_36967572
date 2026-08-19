const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving'
const NOMINATIM_REQUEST_INTERVAL = 1100

let nextNominatimRequestAt = 0

function waitForSearchTurn(signal) {
  const scheduledAt = Math.max(Date.now(), nextNominatimRequestAt)
  nextNominatimRequestAt = scheduledAt + NOMINATIM_REQUEST_INTERVAL
  const delay = scheduledAt - Date.now()
  if (delay <= 0) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, delay)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timeout)
      reject(new DOMException('The search was cancelled.', 'AbortError'))
    }, { once: true })
  })
}

async function parseResponse(response, message) {
  if (!response.ok) {
    throw new Error(`${message} (HTTP ${response.status})`)
  }

  return response.json()
}

export async function searchAustralianPlaces(query, signal) {
  const searchText = query.trim()
  if (!searchText) return []

  await waitForSearchTurn(signal)

  const parameters = new URLSearchParams({
    q: searchText,
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'au',
    limit: '5'
  })
  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${parameters}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-AU,en'
    },
    signal
  })
  const results = await parseResponse(response, 'Place search failed')

  return results.map((result) => ({
    id: `${result.osm_type}-${result.osm_id}`,
    name: result.display_name,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    category: result.type
  }))
}

export async function calculateDrivingRoute(origin, destination, signal) {
  const coordinates = [origin, destination]
    .map((place) => `${place.longitude},${place.latitude}`)
    .join(';')
  const parameters = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    steps: 'false'
  })
  const response = await fetch(`${OSRM_ROUTE_URL}/${coordinates}?${parameters}`, {
    headers: { Accept: 'application/json' },
    signal
  })
  const data = await parseResponse(response, 'Route planning failed')

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No driving route is available between the selected places.')
  }

  const route = data.routes[0]
  return {
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
    distanceKilometres: route.distance / 1000,
    durationMinutes: route.duration / 60
  }
}

export function requestCurrentLocation() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Location services are not supported by this browser.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        id: 'current-location',
        name: 'Your current location',
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMetres: coords.accuracy
      }),
      (error) => {
        const messages = {
          1: 'Location permission was denied. Enable it in your browser settings or search for a starting point.',
          2: 'Your current location could not be determined. Search for a starting point instead.',
          3: 'Finding your location timed out. Please try again or search for a starting point.'
        }
        reject(new Error(messages[error.code] || 'Your current location could not be determined.'))
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  })
}
