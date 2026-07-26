import { STORAGE_KEYS, readStorage, writeStorage } from './storage'

const initialRatings = [
  { workshopId: 'workshop-healthcare-101', userId: 'sample-student-1', value: 5 },
  { workshopId: 'workshop-healthcare-101', userId: 'sample-student-2', value: 4 },
  { workshopId: 'workshop-healthcare-101', userId: 'sample-student-3', value: 4 },
  { workshopId: 'workshop-study-calm', userId: 'sample-student-1', value: 4 },
  { workshopId: 'workshop-study-calm', userId: 'sample-student-2', value: 5 },
  { workshopId: 'workshop-connections', userId: 'sample-student-2', value: 5 },
  { workshopId: 'workshop-connections', userId: 'sample-student-3', value: 5 }
]

export function getRatings() {
  const stored = readStorage(STORAGE_KEYS.ratings, null)
  if (Array.isArray(stored)) return stored
  writeStorage(STORAGE_KEYS.ratings, initialRatings)
  return structuredClone(initialRatings)
}

export function saveRatings(ratings) {
  writeStorage(STORAGE_KEYS.ratings, ratings)
}
