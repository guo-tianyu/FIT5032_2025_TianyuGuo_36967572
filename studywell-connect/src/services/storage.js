export const STORAGE_KEYS = {
  resources: 'studywell_resources',
  requests: 'studywell_requests',
  workshops: 'studywell_workshops',
  ratings: 'studywell_ratings'
}

export function readStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key)
    return savedValue === null ? fallback : JSON.parse(savedValue)
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
