<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import resources from '@/data/resources.json'
import { authState } from '@/services/auth'
import { getOfflinePack, removeOfflinePack, saveOfflinePack } from '@/services/offline'
import { STORAGE_KEYS, readStorage, writeStorage } from '@/services/storage'

const router = useRouter()
const searchTerm = ref('')
const selectedCategory = ref('All')
const storedBookmarks = readStorage(STORAGE_KEYS.resources, {})
const bookmarkStore = ref(storedBookmarks && typeof storedBookmarks === 'object' && !Array.isArray(storedBookmarks) ? storedBookmarks : {})
const offlinePack = ref(getOfflinePack(authState.currentUser?.id))
const offlineStatus = ref('')

const categories = ['All', ...new Set(resources.map((resource) => resource.category))]

const filteredResources = computed(() => {
  const search = searchTerm.value.trim().toLowerCase()
  return resources.filter((resource) => {
    const matchesCategory = selectedCategory.value === 'All' || resource.category === selectedCategory.value
    const searchableText = `${resource.title} ${resource.summary} ${resource.languages.join(' ')}`.toLowerCase()
    return matchesCategory && (!search || searchableText.includes(search))
  })
})

const savedResourceIds = computed(() => {
  const userId = authState.currentUser?.id
  const saved = userId ? bookmarkStore.value[userId] : []
  return Array.isArray(saved) ? saved : []
})
const savedResources = computed(() => resources.filter((resource) => savedResourceIds.value.includes(resource.id)))

function clearFilters() {
  searchTerm.value = ''
  selectedCategory.value = 'All'
}

function toggleBookmark(resourceId) {
  const user = authState.currentUser
  if (!user || user.role !== 'student') {
    router.push({ name: 'auth', query: { redirect: '/resources' } })
    return
  }
  const current = savedResourceIds.value
  bookmarkStore.value = {
    ...bookmarkStore.value,
    [user.id]: current.includes(resourceId) ? current.filter((id) => id !== resourceId) : [...current, resourceId]
  }
  writeStorage(STORAGE_KEYS.resources, bookmarkStore.value)
}

function prepareOfflinePack() {
  const user = authState.currentUser
  offlineStatus.value = ''
  if (!user || user.role !== 'student') {
    router.push({ name: 'auth', query: { redirect: '/resources' } })
    return
  }
  if (!savedResources.value.length) {
    offlineStatus.value = 'Save at least one guide before preparing your offline pack.'
    return
  }
  offlinePack.value = saveOfflinePack(user.id, savedResources.value)
  offlineStatus.value = `${savedResources.value.length} guide${savedResources.value.length === 1 ? '' : 's'} saved for offline use.`
}

function clearOfflinePack() {
  removeOfflinePack(authState.currentUser?.id)
  offlinePack.value = null
  offlineStatus.value = 'Offline pack removed from this device.'
}

function formatSavedAt(value) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}
</script>

<template>
  <section class="find-help-hero">
    <div class="container py-5">
      <p class="eyebrow">Student health library</p>
      <h1>Clear answers for everyday health.</h1>
      <p>Practical guides for navigating healthcare and wellbeing in Australia, written with international student questions in mind.</p>
    </div>
  </section>

  <section class="section-space resources-section">
    <div class="container">
      <section class="offline-pack" aria-labelledby="offline-pack-title">
        <div class="offline-pack-heading">
          <div>
            <p class="eyebrow">Available without internet</p>
            <h2 id="offline-pack-title">Offline support pack</h2>
            <p>Bookmark useful guides, then save a private copy with essential Australian support numbers on this device.</p>
          </div>
          <div class="offline-pack-actions">
            <button class="btn btn-brand" type="button" @click="prepareOfflinePack">{{ offlinePack ? 'Update offline pack' : 'Prepare offline pack' }}</button>
            <button v-if="offlinePack" class="btn btn-outline-secondary" type="button" @click="clearOfflinePack">Remove</button>
          </div>
        </div>

        <p v-if="offlineStatus" class="offline-pack-status" role="status" aria-live="polite">{{ offlineStatus }}</p>
        <div v-if="offlinePack" class="offline-pack-content">
          <div>
            <strong>{{ offlinePack.resources.length }} saved guide{{ offlinePack.resources.length === 1 ? '' : 's' }}</strong>
            <small>Updated {{ formatSavedAt(offlinePack.savedAt) }}</small>
            <ul><li v-for="resource in offlinePack.resources" :key="resource.id">{{ resource.title }}</li></ul>
          </div>
          <div>
            <strong>Essential contacts</strong>
            <ul><li v-for="contact in offlinePack.emergencyContacts" :key="contact.phone"><a :href="`tel:${contact.phone.replace(/\s/g, '')}`">{{ contact.name }} · {{ contact.phone }}</a><small>{{ contact.description }}</small></li></ul>
          </div>
        </div>
        <p v-else class="offline-pack-empty">Your saved guides remain bookmarked locally. Prepare a pack to make their details and essential contacts clearly available offline.</p>
      </section>

      <div class="resource-toolbar">
        <label class="resource-search">
          <span class="visually-hidden">Search health resources</span>
          <i aria-hidden="true">⌕</i>
          <input v-model="searchTerm" type="search" maxlength="60" placeholder="Search topics or languages…" />
        </label>
        <div class="category-filters" role="group" aria-label="Filter resources by category">
          <button v-for="category in categories" :key="category" type="button" :class="{ active: selectedCategory === category }" :aria-pressed="selectedCategory === category" @click="selectedCategory = category">
            {{ category }}
          </button>
        </div>
      </div>

      <p class="result-count" aria-live="polite" aria-atomic="true">Showing {{ filteredResources.length }} of {{ resources.length }} resources</p>

      <div v-if="filteredResources.length" class="row g-4">
        <div v-for="resource in filteredResources" :key="resource.id" class="col-md-6 col-xl-4">
          <article class="resource-card h-100">
            <div class="resource-card-top">
              <span class="resource-icon" aria-hidden="true">{{ resource.icon }}</span>
              <div class="d-flex align-items-center gap-2">
                <span v-if="resource.featured" class="featured-label">Featured</span>
                <button class="bookmark-button" type="button" :aria-label="`${savedResourceIds.includes(resource.id) ? 'Remove' : 'Save'} ${resource.title}`" @click="toggleBookmark(resource.id)">{{ savedResourceIds.includes(resource.id) ? '●' : '○' }}</button>
              </div>
            </div>
            <p class="resource-category">{{ resource.category }}</p>
            <h2>{{ resource.title }}</h2>
            <p class="resource-summary">{{ resource.summary }}</p>
            <div class="resource-details">
              <span>{{ resource.readTime }} min read</span>
              <span>{{ resource.languages.length }} language{{ resource.languages.length === 1 ? '' : 's' }}</span>
            </div>
            <details>
              <summary>Available languages</summary>
              <p>{{ resource.languages.join(' · ') }}</p>
            </details>
          </article>
        </div>
      </div>

      <div v-else class="empty-state">
        <span aria-hidden="true">⌕</span>
        <h2>No resources found</h2>
        <p>Try another search word or show all categories.</p>
        <button class="btn btn-outline-brand" type="button" @click="clearFilters">Clear filters</button>
      </div>

      <aside class="health-disclaimer">
        <strong>Important:</strong> These student guides provide general information only. For personal medical advice, speak with a qualified health professional. In an emergency, call 000.
      </aside>
    </div>
  </section>
</template>
