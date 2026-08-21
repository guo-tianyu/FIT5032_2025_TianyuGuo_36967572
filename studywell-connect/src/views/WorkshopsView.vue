<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authState } from '@/services/auth'
import { getWorkshops, saveWorkshops } from '@/services/workshops'
import { getRatings, saveRatings } from '@/services/ratings'

const router = useRouter()
const workshops = ref(getWorkshops())
const ratings = ref(getRatings())
const notice = ref('')
const visibleWorkshops = computed(() => workshops.value.filter((workshop) => workshop.published))

const dateValue = (value) => new Date(`${value}T00:00:00`)
const month = (value) => new Intl.DateTimeFormat('en-AU', { month: 'short' }).format(dateValue(value))
const day = (value) => dateValue(value).getDate()

function myRating(workshopId) {
  return ratings.value.find((rating) => rating.workshopId === workshopId && rating.userId === authState.currentUser?.id)?.value || 0
}

function ratingSummary(workshopId) {
  const workshopRatings = ratings.value.filter((rating) => rating.workshopId === workshopId)
  const average = workshopRatings.length ? workshopRatings.reduce((sum, rating) => sum + rating.value, 0) / workshopRatings.length : 0
  return { average: average ? average.toFixed(1) : 'New', count: workshopRatings.length }
}

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
  workshop.bookedUserIds = booked ? workshop.bookedUserIds.filter((id) => id !== userId) : [...workshop.bookedUserIds, userId]
  saveWorkshops(workshops.value)
  showNotice(booked ? 'Your booking has been cancelled.' : 'Your workshop place is confirmed.')
}

function submitRating(workshop, value) {
  if (!requireStudent()) return
  const numericValue = Number(value)
  if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 5) {
    showNotice('Choose a rating between 1 and 5 stars.')
    return
  }
  const existing = ratings.value.find((rating) => rating.workshopId === workshop.id && rating.userId === authState.currentUser.id)
  if (existing) {
    existing.value = numericValue
    existing.updatedAt = new Date().toISOString()
  } else {
    ratings.value.push({ workshopId: workshop.id, userId: authState.currentUser.id, value: numericValue, updatedAt: new Date().toISOString() })
  }
  saveRatings(ratings.value)
  showNotice(`Your ${numericValue}-star rating has been included.`)
}
</script>

<template>
  <section class="find-help-hero">
    <div class="container py-5"><p class="eyebrow">Free student workshops</p><h1>Learn together. Feel more at home.</h1><p>Join welcoming sessions about healthcare, wellbeing and connection. Places are free, and no previous knowledge is needed.</p></div>
  </section>

  <section class="section-space">
    <div class="container workshop-list">
      <article v-for="workshop in visibleWorkshops" :key="workshop.id" class="workshop-card">
        <div class="workshop-date"><strong>{{ day(workshop.date) }}</strong><span>{{ month(workshop.date) }}</span></div>
        <div class="workshop-main">
          <p class="resource-category">{{ workshop.type }}</p><h2>{{ workshop.title }}</h2><p>{{ workshop.description }}</p>
          <div class="workshop-details"><span>◷ {{ workshop.time }}</span><span>⌖ {{ workshop.location }}</span><span>◌ {{ workshop.language }}</span></div>
          <div class="capacity-row"><div class="capacity-track"><span :style="{ width: `${Math.min(100, (workshop.bookedUserIds.length / workshop.capacity) * 100)}%` }"></span></div><small>{{ workshop.capacity - workshop.bookedUserIds.length }} of {{ workshop.capacity }} places left</small></div>
        </div>
        <div class="workshop-actions">
          <div class="rating-summary"><span aria-hidden="true">★</span><strong>{{ ratingSummary(workshop.id).average }}</strong><small>{{ ratingSummary(workshop.id).count }} rating{{ ratingSummary(workshop.id).count === 1 ? '' : 's' }}</small></div>
          <button class="btn btn-brand" type="button" @click="toggleBooking(workshop)">{{ workshop.bookedUserIds.includes(authState.currentUser?.id) ? 'Cancel booking' : 'Book a place' }}</button>
          <fieldset class="star-rating"><legend>{{ myRating(workshop.id) ? 'Your rating' : 'Rate this workshop' }}</legend><button v-for="star in 5" :key="star" type="button" :class="{ selected: star <= myRating(workshop.id) }" :aria-label="`${star} star${star === 1 ? '' : 's'} for ${workshop.title}`" @click="submitRating(workshop, star)">★</button></fieldset>
        </div>
      </article>
      <div v-if="!visibleWorkshops.length" class="empty-state"><h2>No published workshops</h2><p>Please check again soon.</p></div>
    </div>
  </section>

  <div v-if="notice" class="toast-notice" role="status"><span aria-hidden="true">✓</span>{{ notice }}</div>
</template>
