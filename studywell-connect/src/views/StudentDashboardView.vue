<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AppointmentCalendar from '@/components/AppointmentCalendar.vue'
import { authState } from '@/services/auth'
import {
  APPOINTMENT_TYPES,
  bookAppointment,
  cancelAppointment,
  subscribeToAppointments
} from '@/services/appointments'
import resources from '@/data/resources.json'
import { STORAGE_KEYS, readStorage } from '@/services/storage'
import { getWorkshops } from '@/services/workshops'
import { getRatings } from '@/services/ratings'

const storedRequests = readStorage(STORAGE_KEYS.requests, [])
const storedBookmarks = readStorage(STORAGE_KEYS.resources, {})
const requests = ref(Array.isArray(storedRequests) ? storedRequests : [])
const bookmarkStore = ref(storedBookmarks && typeof storedBookmarks === 'object' && !Array.isArray(storedBookmarks) ? storedBookmarks : {})
const workshops = ref(getWorkshops())
const ratings = ref(getRatings())
const appointments = ref([])
const appointmentsLoading = ref(true)
const appointmentBusy = ref(false)
const cancellingAppointmentId = ref('')
const appointmentError = ref('')
const appointmentStatus = ref('')
const selectedSlot = ref(null)
const appointmentForm = reactive({ type: APPOINTMENT_TYPES[0], notes: '' })
let stopAppointmentsSubscription

const myRequests = computed(() => {
  const userId = authState.currentUser?.id
  return userId ? requests.value.filter((request) => request.userId === userId) : []
})
const mySavedResources = computed(() => {
  const userId = authState.currentUser?.id
  const ids = userId ? bookmarkStore.value[userId] || [] : []
  return resources.filter((resource) => ids.includes(resource.id))
})
const myWorkshops = computed(() => {
  const userId = authState.currentUser?.id
  return userId ? workshops.value.filter((workshop) => workshop.bookedUserIds.includes(userId)) : []
})
const myRatings = computed(() => {
  const userId = authState.currentUser?.id
  return userId ? ratings.value.filter((rating) => rating.userId === userId) : []
})
const appointmentEvents = computed(() => appointments.value.map((appointment) => ({
  id: appointment.id,
  title: appointment.type,
  start: appointment.start,
  end: appointment.end,
  backgroundColor: '#24594d',
  borderColor: '#24594d'
})))
const upcomingAppointments = computed(() => appointments.value.filter(
  (appointment) => new Date(appointment.end) > new Date()
))

function formatDate(value) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

function chooseAppointmentSlot(information) {
  appointmentError.value = ''
  appointmentStatus.value = ''
  if (information.allDay) {
    appointmentError.value = 'Switch to Week view and select a 30-minute time slot.'
    selectedSlot.value = null
    return
  }
  if (information.date <= new Date()) {
    appointmentError.value = 'Choose a future appointment time.'
    selectedSlot.value = null
    return
  }
  selectedSlot.value = information.date
}

async function submitAppointment() {
  appointmentError.value = ''
  appointmentStatus.value = ''
  if (!selectedSlot.value || appointmentBusy.value) {
    appointmentError.value = 'Select an available time in Week view first.'
    return
  }

  appointmentBusy.value = true
  try {
    await bookAppointment({
      student: authState.currentUser,
      type: appointmentForm.type,
      notes: appointmentForm.notes,
      start: selectedSlot.value
    })
    appointmentStatus.value = `Appointment booked for ${formatDateTime(selectedSlot.value)}.`
    selectedSlot.value = null
    appointmentForm.notes = ''
  } catch (error) {
    appointmentError.value = error.message || 'The appointment could not be booked.'
  } finally {
    appointmentBusy.value = false
  }
}

async function removeAppointment(appointment) {
  appointmentError.value = ''
  appointmentStatus.value = ''
  cancellingAppointmentId.value = appointment.id
  try {
    await cancelAppointment(appointment.id)
    appointmentStatus.value = `Appointment on ${formatDateTime(appointment.start)} cancelled.`
  } catch {
    appointmentError.value = 'The appointment could not be cancelled. Please try again.'
  } finally {
    cancellingAppointmentId.value = ''
  }
}

onMounted(() => {
  stopAppointmentsSubscription = subscribeToAppointments({
    userId: authState.currentUser.id,
    onData: (items) => {
      appointments.value = items
      appointmentsLoading.value = false
    },
    onError: (message) => {
      appointmentError.value = message
      appointmentsLoading.value = false
    }
  })
})

onBeforeUnmount(() => stopAppointmentsSubscription?.())
</script>

<template>
  <section class="dashboard-hero">
    <div class="container"><p class="eyebrow eyebrow-light">Student dashboard · protected</p><h1>Welcome, {{ authState.currentUser?.name.split(' ')[0] }}.</h1><p>Your saved health support, all in one place.</p></div>
  </section>
  <section class="section-space dashboard-page">
    <div class="container dashboard-layout">
      <aside class="profile-card"><div class="profile-avatar">{{ authState.currentUser?.name.charAt(0) }}</div><h2>{{ authState.currentUser?.name }}</h2><p>{{ authState.currentUser?.email }}</p><span>Student account</span><small>Only you can see the items on this dashboard.</small></aside>
      <div class="dashboard-content">
        <section class="appointment-section">
          <div class="dashboard-heading"><div><p class="eyebrow">Private support</p><h2>Book an appointment</h2></div><span>30-minute sessions</span></div>
          <p>Select <strong>Week</strong>, then choose a future time between 9:00 am and 5:00 pm, Monday to Friday. Already-booked times appear on your calendar.</p>
          <AppointmentCalendar :events="appointmentEvents" selectable @select-slot="chooseAppointmentSlot" />

          <form class="appointment-form" novalidate @submit.prevent="submitAppointment">
            <div class="selected-slot" aria-live="polite">
              <strong>Selected time</strong>
              <span>{{ selectedSlot ? formatDateTime(selectedSlot) : 'No time selected' }}</span>
            </div>
            <div class="form-field">
              <label for="appointment-type">Support area</label>
              <select id="appointment-type" v-model="appointmentForm.type" :disabled="appointmentBusy">
                <option v-for="type in APPOINTMENT_TYPES" :key="type">{{ type }}</option>
              </select>
            </div>
            <div class="form-field appointment-notes">
              <label for="appointment-notes">Notes for the support team <span>(optional)</span></label>
              <textarea id="appointment-notes" v-model="appointmentForm.notes" rows="3" maxlength="240" :disabled="appointmentBusy"></textarea>
              <small>{{ appointmentForm.notes.length }}/240</small>
            </div>
            <button class="btn btn-brand" type="submit" :disabled="!selectedSlot || appointmentBusy">
              {{ appointmentBusy ? 'Booking…' : 'Book appointment' }}
            </button>
          </form>

          <p v-if="appointmentError" class="appointment-message appointment-error" role="alert">{{ appointmentError }}</p>
          <p v-if="appointmentStatus" class="appointment-message appointment-success" role="status" aria-live="polite">{{ appointmentStatus }}</p>

          <div class="upcoming-appointments">
            <h3>My upcoming appointments</h3>
            <p v-if="appointmentsLoading">Loading appointments…</p>
            <div v-else-if="upcomingAppointments.length" class="dashboard-list">
              <article v-for="appointment in upcomingAppointments" :key="appointment.id">
                <div><small>{{ formatDateTime(appointment.start) }}</small><h3>{{ appointment.type }}</h3></div>
                <button class="btn btn-outline-danger btn-sm" type="button" :disabled="cancellingAppointmentId === appointment.id" @click="removeAppointment(appointment)">
                  {{ cancellingAppointmentId === appointment.id ? 'Cancelling…' : 'Cancel' }}
                </button>
              </article>
            </div>
            <div v-else class="dashboard-empty"><p>You have no upcoming support appointments.</p></div>
          </div>
        </section>
        <section>
          <div class="dashboard-heading"><div><p class="eyebrow">Support progress</p><h2>My requests</h2></div><RouterLink to="/support">New request →</RouterLink></div>
          <div v-if="myRequests.length" class="dashboard-list"><article v-for="request in myRequests" :key="request.id"><div><small>{{ formatDate(request.createdAt) }} · {{ request.category }}</small><h3>{{ request.subject }}</h3></div><span :class="['status-badge', `status-${request.status.toLowerCase().replace(' ', '-')}`]">{{ request.status }}</span></article></div>
          <div v-else class="dashboard-empty"><p>You have not submitted a support request.</p><RouterLink to="/support">Ask for guidance</RouterLink></div>
        </section>
        <section>
          <div class="dashboard-heading"><div><p class="eyebrow">Read later</p><h2>Saved resources</h2></div><RouterLink to="/resources">Browse library →</RouterLink></div>
          <div v-if="mySavedResources.length" class="saved-resource-grid"><article v-for="resource in mySavedResources" :key="resource.id"><span>{{ resource.icon }}</span><div><small>{{ resource.category }}</small><h3>{{ resource.title }}</h3></div></article></div>
          <div v-else class="dashboard-empty"><p>You have not saved any health guides yet.</p><RouterLink to="/resources">Explore resources</RouterLink></div>
        </section>
        <section>
          <div class="dashboard-heading"><div><p class="eyebrow">Coming up</p><h2>My workshops</h2></div><RouterLink to="/workshops">Find workshops →</RouterLink></div>
          <div v-if="myWorkshops.length" class="dashboard-list"><article v-for="workshop in myWorkshops" :key="workshop.id"><div><small>{{ formatDate(workshop.date) }} · {{ workshop.time }}</small><h3>{{ workshop.title }}</h3></div><span>{{ workshop.location }}<template v-if="myRatings.find((rating) => rating.workshopId === workshop.id)"><br>Your rating: {{ myRatings.find((rating) => rating.workshopId === workshop.id).value }}/5</template></span></article></div>
          <div v-else class="dashboard-empty"><p>You have not booked a workshop.</p><RouterLink to="/workshops">View free sessions</RouterLink></div>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.appointment-section > p {
  color: #5e716c;
  line-height: 1.6;
}

.appointment-form {
  margin-top: 18px;
  padding: 18px;
  display: grid;
  grid-template-columns: minmax(190px, 0.8fr) minmax(190px, 1fr) minmax(240px, 1.5fr) auto;
  gap: 14px;
  align-items: end;
  background: #eef4f1;
  border-radius: 8px;
}

.selected-slot {
  min-height: 66px;
  padding: 10px 12px;
  display: grid;
  align-content: center;
  background: #fff;
  border: 1px solid #d6dfdc;
  border-radius: 5px;
}

.selected-slot span {
  margin-top: 3px;
  color: #526d66;
}

.appointment-notes label span {
  color: #657873;
  font-weight: 400;
}

.appointment-notes small {
  display: block;
  margin-top: 4px;
  color: #657873;
  text-align: right;
}

.appointment-message {
  margin: 14px 0 0;
  padding: 11px 13px;
  border-radius: 5px;
}

.appointment-error {
  color: #8f2525;
  background: #fff0f0;
  border: 1px solid #e8b4b4;
}

.appointment-success {
  color: #205d42;
  background: #e7f5ed;
  border: 1px solid #a9d6bc;
}

.upcoming-appointments {
  margin-top: 24px;
}

.upcoming-appointments > h3 {
  margin-bottom: 12px;
  font-size: 20px;
}

@media (max-width: 1199px) {
  .appointment-form {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  .appointment-form {
    grid-template-columns: 1fr;
  }
}
</style>
