<script setup>
import { computed, ref } from 'vue'
import { authState } from '@/services/auth'
import { STORAGE_KEYS, readStorage, writeStorage } from '@/services/storage'

const requests = ref(readStorage(STORAGE_KEYS.requests, []))

const requestCounts = computed(() => ({
  total: requests.value.length,
  submitted: requests.value.filter((request) => request.status === 'Submitted').length,
  active: requests.value.filter((request) => request.status === 'In Progress').length,
  resolved: requests.value.filter((request) => request.status === 'Resolved').length
}))

function updateRequestStatus(request, status) {
  if (authState.currentUser.role !== 'staff') return
  request.status = status
  writeStorage(STORAGE_KEYS.requests, requests.value)
}
</script>

<template>
  <section class="dashboard-hero staff-hero">
    <div class="container">
      <p class="eyebrow eyebrow-light">Staff dashboard · protected</p>
      <h1>Coordinate student support.</h1>
      <p>Welcome, {{ authState.currentUser.name }}. Review requests and update their progress.</p>
    </div>
  </section>

  <section class="section-space dashboard-page">
    <div class="container">
      <div class="staff-stats">
        <article><strong>{{ requestCounts.total }}</strong><span>Total requests</span></article>
        <article><strong>{{ requestCounts.submitted }}</strong><span>Awaiting review</span></article>
        <article><strong>{{ requestCounts.active }}</strong><span>In progress</span></article>
        <article><strong>{{ requestCounts.resolved }}</strong><span>Resolved</span></article>
      </div>

      <section class="staff-panel">
        <div class="dashboard-heading">
          <div><p class="eyebrow">Student support</p><h2>Request queue</h2></div>
        </div>
        <div v-if="requests.length" class="request-table-wrap">
          <table class="request-table">
            <thead><tr><th>Student</th><th>Request</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="request in requests" :key="request.id">
                <td><strong>{{ request.name }}</strong><small>{{ request.email }}</small></td>
                <td><strong>{{ request.subject }}</strong><small>{{ request.category }}</small></td>
                <td>
                  <select :value="request.status" :aria-label="`Status for ${request.subject}`" @change="updateRequestStatus(request, $event.target.value)">
                    <option>Submitted</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="dashboard-empty"><p>No support requests have been submitted.</p></div>
      </section>
    </div>
  </section>
</template>
