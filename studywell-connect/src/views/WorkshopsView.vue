<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authState } from '@/services/auth'
import { getWorkshops, saveWorkshops } from '@/services/workshops'

const router = useRouter()
const workshops = ref(getWorkshops())
const notice = ref('')
const visibleWorkshops = computed(() => workshops.value.filter((workshop) => workshop.published))

const dateValue = (value) => new Date(`${value}T00:00:00`)
const month = (value) => new Intl.DateTimeFormat('en-AU', { month: 'short' }).format(dateValue(value))
const day = (value) => dateValue(value).getDate()

function showNotice(message) {
  notice.value = message
  window.setTimeout(() => { if (notice.value === message) notice.value = '' }, 3000)
}

function requireStudent() {
  if (authState.currentUser?.role === 'student') return true
  router.push({ name: 'auth', query: { redirect: '/workshops' } })
  return false
}

function toggleBooking(workshop) {
  if (!requireStudent()) return
  const userId = authState.currentUser.id
  const booked = workshop.bookedUserIds.includes(userId)
  if (!booked && workshop.bookedUserIds.length >= workshop.capacity) {
    showNotice('This workshop is currently full.')
    return
  }
  workshop.bookedUserIds = booked
    ? workshop.bookedUserIds.filter((id) => id !== userId)
    : [...workshop.bookedUserIds, userId]
  saveWorkshops(workshops.value)
  showNotice(booked ? 'Your booking has been cancelled.' : 'Your workshop place is confirmed.')
}
</script>

<template>
  <section class="inner-hero workshops-hero">
    <div class="container inner-hero-content">
      <p class="eyebrow">Free student workshops</p>
      <h1>Learn together. Feel more at home.</h1>
      <p>Join welcoming sessions about healthcare, wellbeing and connection. Places are free, and no previous knowledge is needed.</p>
    </div>
  </section>

  <section class="section-space">
    <div class="container workshop-list">
      <article v-for="workshop in visibleWorkshops" :key="workshop.id" class="workshop-card">
        <div class="workshop-date"><strong>{{ day(workshop.date) }}</strong><span>{{ month(workshop.date) }}</span></div>
        <div class="workshop-main">
          <p class="resource-category">{{ workshop.type }}</p>
          <h2>{{ workshop.title }}</h2>
          <p>{{ workshop.description }}</p>
          <div class="workshop-details"><span>◷ {{ workshop.time }}</span><span>⌖ {{ workshop.location }}</span><span>◌ {{ workshop.language }}</span></div>
          <div class="capacity-row">
            <div class="capacity-track"><span :style="{ width: `${Math.min(100, (workshop.bookedUserIds.length / workshop.capacity) * 100)}%` }"></span></div>
            <small>{{ workshop.capacity - workshop.bookedUserIds.length }} of {{ workshop.capacity }} places left</small>
          </div>
        </div>
        <div class="workshop-actions">
          <button class="btn btn-brand" type="button" @click="toggleBooking(workshop)">
            {{ workshop.bookedUserIds.includes(authState.currentUser?.id) ? 'Cancel booking' : 'Book a place' }}
          </button>
        </div>
      </article>
      <div v-if="!visibleWorkshops.length" class="empty-state"><h2>No published workshops</h2><p>Please check again soon.</p></div>
    </div>
  </section>

  <div v-if="notice" class="toast-notice" role="status"><span aria-hidden="true">✓</span>{{ notice }}</div>
</template>
