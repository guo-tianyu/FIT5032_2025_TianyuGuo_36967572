<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import resources from '@/data/resources.json'
import { authState } from '@/services/auth'
import { STORAGE_KEYS, readStorage, writeStorage } from '@/services/storage'

const router = useRouter()
const searchTerm = ref('')
const selectedCategory = ref('All')
const storedBookmarks = readStorage(STORAGE_KEYS.resources, {})
const bookmarkStore = ref(storedBookmarks && typeof storedBookmarks === 'object' && !Array.isArray(storedBookmarks) ? storedBookmarks : {})

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
</script>

<template>
  <section class="inner-hero resource-hero">
    <div class="container inner-hero-content">
      <p class="eyebrow">Student health library</p>
      <h1>Clear answers for everyday health.</h1>
      <p>Practical guides for navigating healthcare and wellbeing in Australia, written with international student questions in mind.</p>
    </div>
  </section>

  <section class="section-space resources-section">
    <div class="container">
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
