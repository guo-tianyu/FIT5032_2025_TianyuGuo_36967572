<script setup>
import { computed, reactive, ref } from 'vue'
import { authState } from '@/services/auth'
import { STORAGE_KEYS, readStorage, writeStorage } from '@/services/storage'
import { getWorkshops, saveWorkshops } from '@/services/workshops'

const storedRequests = readStorage(STORAGE_KEYS.requests, [])
const requests = ref(Array.isArray(storedRequests) ? storedRequests : [])
const workshops = ref(getWorkshops())
const workshopForm = reactive({ title: '', type: 'Health orientation', date: '', time: '', location: '', language: 'English', capacity: 20, description: '' })
const formErrors = reactive({ title: '', date: '', time: '', location: '', capacity: '', description: '' })

const requestCounts = computed(() => ({
  total: requests.value.length,
  submitted: requests.value.filter((request) => request.status === 'Submitted').length,
  active: requests.value.filter((request) => request.status === 'In Progress').length
}))

function saveRequests() {
  writeStorage(STORAGE_KEYS.requests, requests.value)
}

function updateRequestStatus(request, status) {
  if (authState.currentUser?.role !== 'staff') return
  request.status = status
  saveRequests()
}

function validateWorkshop() {
  Object.keys(formErrors).forEach((key) => { formErrors[key] = '' })
  if (workshopForm.title.trim().length < 5) formErrors.title = 'Use at least 5 characters for the title.'
  if (!workshopForm.date) formErrors.date = 'Choose a workshop date.'
  if (workshopForm.date && new Date(`${workshopForm.date}T00:00:00`) < new Date(new Date().toDateString())) formErrors.date = 'The date cannot be in the past.'
  if (!workshopForm.time) formErrors.time = 'Choose a start time.'
  if (workshopForm.location.trim().length < 3) formErrors.location = 'Enter a clear location.'
  if (Number(workshopForm.capacity) < 5 || Number(workshopForm.capacity) > 100) formErrors.capacity = 'Capacity must be between 5 and 100.'
  if (workshopForm.description.trim().length < 20) formErrors.description = 'Use at least 20 characters for the description.'
  return !Object.values(formErrors).some(Boolean)
}

function addWorkshop() {
  if (authState.currentUser?.role !== 'staff' || !validateWorkshop()) return
  workshops.value.push({ id: crypto.randomUUID(), title: workshopForm.title.trim().slice(0, 80), type: workshopForm.type, date: workshopForm.date, time: workshopForm.time, location: workshopForm.location.trim().slice(0, 100), language: workshopForm.language, capacity: Number(workshopForm.capacity), bookedUserIds: [], published: false, description: workshopForm.description.trim().slice(0, 220) })
  saveWorkshops(workshops.value)
  Object.assign(workshopForm, { title: '', type: 'Health orientation', date: '', time: '', location: '', language: 'English', capacity: 20, description: '' })
}

function togglePublished(workshop) {
  if (authState.currentUser?.role !== 'staff') return
  workshop.published = !workshop.published
  saveWorkshops(workshops.value)
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}
</script>

<template>
  <section class="dashboard-hero staff-hero"><div class="container"><p class="eyebrow eyebrow-light">Staff dashboard · protected</p><h1>Coordinate student support.</h1><p>Welcome, {{ authState.currentUser?.name }}. Review requests and prepare community workshops.</p></div></section>
  <section class="section-space dashboard-page">
    <div class="container">
      <div class="staff-stats"><article><strong>{{ requestCounts.total }}</strong><span>Total requests</span></article><article><strong>{{ requestCounts.submitted }}</strong><span>Awaiting review</span></article><article><strong>{{ requestCounts.active }}</strong><span>In progress</span></article><article><strong>{{ workshops.filter((item) => item.published).length }}</strong><span>Published workshops</span></article></div>

      <div class="staff-grid">
        <section class="staff-panel"><div class="dashboard-heading"><div><p class="eyebrow">Student support</p><h2>Request queue</h2></div></div>
          <div v-if="requests.length" class="request-table-wrap"><table class="request-table"><thead><tr><th>Student</th><th>Request</th><th>Status</th></tr></thead><tbody><tr v-for="request in requests" :key="request.id"><td><strong>{{ request.name }}</strong><small>{{ request.email }}</small></td><td><strong>{{ request.subject }}</strong><small>{{ request.category }}</small></td><td><select :value="request.status" :aria-label="`Status for ${request.subject}`" @change="updateRequestStatus(request, $event.target.value)"><option>Submitted</option><option>In Progress</option><option>Resolved</option></select></td></tr></tbody></table></div>
          <div v-else class="dashboard-empty"><p>No support requests have been submitted.</p></div>
        </section>

        <section class="staff-panel"><p class="eyebrow">Workshop management</p><h2>Create a draft</h2>
          <form novalidate @submit.prevent="addWorkshop">
            <div class="form-field mb-3"><label for="workshop-title">Workshop title</label><input id="workshop-title" v-model="workshopForm.title" maxlength="80" :aria-invalid="Boolean(formErrors.title)" /><small v-if="formErrors.title" class="field-error">{{ formErrors.title }}</small></div>
            <div class="row g-3"><div class="col-md-6 form-field"><label for="workshop-type">Type</label><select id="workshop-type" v-model="workshopForm.type"><option>Health orientation</option><option>Wellbeing workshop</option><option>Peer connection</option></select></div><div class="col-md-6 form-field"><label for="workshop-language">Language</label><select id="workshop-language" v-model="workshopForm.language"><option>English</option><option>English + Mandarin support</option><option>English + Hindi support</option></select></div></div>
            <div class="row g-3 mt-0"><div class="col-md-6 form-field"><label for="workshop-date">Date</label><input id="workshop-date" v-model="workshopForm.date" type="date" :aria-invalid="Boolean(formErrors.date)" /><small v-if="formErrors.date" class="field-error">{{ formErrors.date }}</small></div><div class="col-md-6 form-field"><label for="workshop-time">Time</label><input id="workshop-time" v-model="workshopForm.time" type="time" :aria-invalid="Boolean(formErrors.time)" /><small v-if="formErrors.time" class="field-error">{{ formErrors.time }}</small></div></div>
            <div class="row g-3 mt-0"><div class="col-md-8 form-field"><label for="workshop-location">Location</label><input id="workshop-location" v-model="workshopForm.location" maxlength="100" :aria-invalid="Boolean(formErrors.location)" /><small v-if="formErrors.location" class="field-error">{{ formErrors.location }}</small></div><div class="col-md-4 form-field"><label for="workshop-capacity">Capacity</label><input id="workshop-capacity" v-model.number="workshopForm.capacity" type="number" min="5" max="100" :aria-invalid="Boolean(formErrors.capacity)" /><small v-if="formErrors.capacity" class="field-error">{{ formErrors.capacity }}</small></div></div>
            <div class="form-field mt-3"><label for="workshop-description" class="d-flex justify-content-between"><span>Description</span><span>{{ workshopForm.description.length }}/220</span></label><textarea id="workshop-description" v-model="workshopForm.description" rows="4" maxlength="220" :aria-invalid="Boolean(formErrors.description)"></textarea><small v-if="formErrors.description" class="field-error">{{ formErrors.description }}</small></div>
            <button class="btn btn-brand mt-3" type="submit">Save workshop draft</button>
          </form>
        </section>
      </div>

      <section class="staff-panel mt-4"><div class="dashboard-heading"><div><p class="eyebrow">Publishing</p><h2>Workshop schedule</h2></div></div><div class="manage-workshops"><article v-for="workshop in workshops" :key="workshop.id"><div><span :class="['publish-dot', { live: workshop.published }]"></span><div><h3>{{ workshop.title }}</h3><p>{{ formatDate(workshop.date) }} · {{ workshop.bookedUserIds.length }}/{{ workshop.capacity }} booked</p></div></div><button type="button" :class="['publish-button', { live: workshop.published }]" @click="togglePublished(workshop)">{{ workshop.published ? 'Published' : 'Publish' }}</button></article></div></section>
    </div>
  </section>
</template>
