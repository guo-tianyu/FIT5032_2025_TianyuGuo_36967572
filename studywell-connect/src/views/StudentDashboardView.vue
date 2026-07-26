<script setup>
import { computed, ref } from 'vue'
import { authState } from '@/services/auth'
import resources from '@/data/resources.json'
import { STORAGE_KEYS, readStorage } from '@/services/storage'

const requests = ref(readStorage(STORAGE_KEYS.requests, []))
const bookmarkStore = ref(readStorage(STORAGE_KEYS.resources, {}))

const myRequests = computed(() => requests.value.filter((request) => request.userId === authState.currentUser.id))
const mySavedResources = computed(() => {
  const ids = bookmarkStore.value[authState.currentUser.id] || []
  return resources.filter((resource) => ids.includes(resource.id))
})

function formatDate(value) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}
</script>

<template>
  <section class="dashboard-hero">
    <div class="container">
      <p class="eyebrow eyebrow-light">Student dashboard · protected</p>
      <h1>Welcome, {{ authState.currentUser.name.split(' ')[0] }}.</h1>
      <p>Your saved health support, all in one place.</p>
    </div>
  </section>

  <section class="section-space dashboard-page">
    <div class="container dashboard-layout">
      <aside class="profile-card">
        <div class="profile-avatar">{{ authState.currentUser.name.charAt(0) }}</div>
        <h2>{{ authState.currentUser.name }}</h2>
        <p>{{ authState.currentUser.email }}</p>
        <span>Student account</span>
        <small>Only you can see the items on this dashboard.</small>
      </aside>

      <div class="dashboard-content">
        <section>
          <div class="dashboard-heading">
            <div><p class="eyebrow">Support progress</p><h2>My requests</h2></div>
            <RouterLink to="/support">New request →</RouterLink>
          </div>
          <div v-if="myRequests.length" class="dashboard-list">
            <article v-for="request in myRequests" :key="request.id">
              <div><small>{{ formatDate(request.createdAt) }} · {{ request.category }}</small><h3>{{ request.subject }}</h3></div>
              <span :class="['status-badge', `status-${request.status.toLowerCase().replace(' ', '-')}`]">{{ request.status }}</span>
            </article>
          </div>
          <div v-else class="dashboard-empty">
            <p>You have not submitted a support request.</p>
            <RouterLink to="/support">Ask for guidance</RouterLink>
          </div>
        </section>

        <section>
          <div class="dashboard-heading">
            <div><p class="eyebrow">Read later</p><h2>Saved resources</h2></div>
            <RouterLink to="/resources">Browse library →</RouterLink>
          </div>
          <div v-if="mySavedResources.length" class="saved-resource-grid">
            <article v-for="resource in mySavedResources" :key="resource.id">
              <span>{{ resource.icon }}</span>
              <div><small>{{ resource.category }}</small><h3>{{ resource.title }}</h3></div>
            </article>
          </div>
          <div v-else class="dashboard-empty">
            <p>You have not saved any health guides yet.</p>
            <RouterLink to="/resources">Explore resources</RouterLink>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
