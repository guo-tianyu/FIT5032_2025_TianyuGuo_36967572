import { STORAGE_KEYS, readStorage, writeStorage } from './storage'

export const EMERGENCY_CONTACTS = [
  { name: 'Emergency services', phone: '000', description: 'Immediate danger or a life-threatening emergency' },
  { name: 'Lifeline', phone: '13 11 14', description: '24/7 crisis support and suicide prevention' },
  { name: 'Healthdirect', phone: '1800 022 222', description: '24/7 health advice from a registered nurse' }
]

export function getOfflinePack(userId) {
  if (!userId) return null
  const packs = readStorage(STORAGE_KEYS.offlinePacks, {})
  return packs && typeof packs === 'object' ? packs[userId] || null : null
}

export function saveOfflinePack(userId, selectedResources) {
  if (!userId) return null
  const packs = readStorage(STORAGE_KEYS.offlinePacks, {})
  const safePacks = packs && typeof packs === 'object' && !Array.isArray(packs) ? packs : {}
  const pack = {
    savedAt: new Date().toISOString(),
    resources: selectedResources.map(({ id, title, category, summary, languages }) => ({
      id,
      title,
      category,
      summary,
      languages
    })),
    emergencyContacts: EMERGENCY_CONTACTS
  }
  writeStorage(STORAGE_KEYS.offlinePacks, { ...safePacks, [userId]: pack })
  return pack
}

export function removeOfflinePack(userId) {
  if (!userId) return
  const packs = readStorage(STORAGE_KEYS.offlinePacks, {})
  if (!packs || typeof packs !== 'object') return
  const nextPacks = { ...packs }
  delete nextPacks[userId]
  writeStorage(STORAGE_KEYS.offlinePacks, nextPacks)
}

export function registerOfflineWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        { scope: import.meta.env.BASE_URL }
      )
      await navigator.serviceWorker.ready
      window.dispatchEvent(new CustomEvent('studywell-offline-ready', { detail: registration.scope }))
    } catch {
      // The application remains usable online if service worker registration is unavailable.
    }
  }, { once: true })
}
