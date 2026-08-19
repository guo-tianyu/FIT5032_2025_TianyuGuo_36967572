<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AppointmentAnalytics from '@/components/AppointmentAnalytics.vue'
import AppointmentCalendar from '@/components/AppointmentCalendar.vue'
import InteractiveDataTable from '@/components/InteractiveDataTable.vue'
import { authState } from '@/services/auth'
import { subscribeToAppointments } from '@/services/appointments'
import { emailServiceConfigured, sendSupportSummaryEmail } from '@/services/email'
import { createCsvContent, downloadCsv } from '@/services/export'
import { STORAGE_KEYS, readStorage, writeStorage } from '@/services/storage'
import { getWorkshops, saveWorkshops } from '@/services/workshops'

const storedRequests = readStorage(STORAGE_KEYS.requests, [])
const requests = ref(Array.isArray(storedRequests) ? storedRequests : [])
const workshops = ref(getWorkshops())
const appointments = ref([])
const appointmentsLoading = ref(true)
const appointmentsError = ref('')
const selectedAppointmentId = ref('')
let stopAppointmentsSubscription
const editingWorkshopId = ref(null)
const insightsFunctionUrl = import.meta.env.VITE_SUPPORT_INSIGHTS_FUNCTION_URL || ''
const insightsLoading = ref(false)
const insightsResult = ref(null)
const insightsError = ref('')
const emailSending = ref(false)
const emailStatus = ref('')
const emailStatusType = ref('')
const emailForm = reactive({ requestId: '', subject: '', message: '' })
const emailErrors = reactive({ requestId: '', subject: '', message: '' })
const workshopForm = reactive({ title: '', type: 'Health orientation', date: '', time: '', location: '', language: 'English', capacity: 20, description: '' })
const formErrors = reactive({ title: '', date: '', time: '', location: '', capacity: '', description: '' })
const requestColumns = [
  { key: 'student', label: 'Student', value: (request) => `${request.name} ${request.email}` },
  { key: 'request', label: 'Request', value: (request) => `${request.subject} ${request.category}` },
  { key: 'status', label: 'Status' }
]
const workshopColumns = [
  { key: 'title', label: 'Workshop' },
  { key: 'date', label: 'Date' },
  { key: 'location', label: 'Location' },
  { key: 'bookings', label: 'Bookings', value: (workshop) => `${workshop.bookedUserIds.length}/${workshop.capacity}` },
  { key: 'published', label: 'Status', value: (workshop) => workshop.published ? 'Published' : 'Draft' },
  { key: 'actions', label: 'Actions', sortable: false, searchable: false }
]
const requestExportColumns = [
  { key: 'id', label: 'Request ID' },
  { key: 'name', label: 'Student name' },
  { key: 'email', label: 'Email' },
  { key: 'category', label: 'Category' },
  { key: 'subject', label: 'Subject' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created at' }
]
const workshopExportColumns = [
  { key: 'id', label: 'Workshop ID' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'location', label: 'Location' },
  { key: 'language', label: 'Language' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'bookings', label: 'Bookings', value: (workshop) => workshop.bookedUserIds.length },
  { key: 'published', label: 'Published', value: (workshop) => workshop.published ? 'Yes' : 'No' }
]

const requestCounts = computed(() => ({
  total: requests.value.length,
  submitted: requests.value.filter((request) => request.status === 'Submitted').length,
  active: requests.value.filter((request) => request.status === 'In Progress').length
}))
const appointmentEvents = computed(() => appointments.value.map((appointment) => ({
  id: appointment.id,
  appointmentId: appointment.id,
  title: `${appointment.studentName} · ${appointment.type}`,
  start: appointment.start,
  end: appointment.end,
  backgroundColor: '#a64f3b',
  borderColor: '#8f3f2d'
})))
const selectedAppointment = computed(() => appointments.value.find(
  (appointment) => appointment.id === selectedAppointmentId.value
))
const upcomingAppointmentCount = computed(() => appointments.value.filter(
  (appointment) => new Date(appointment.end) > new Date()
).length)

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
  const currentWorkshop = workshops.value.find((workshop) => workshop.id === editingWorkshopId.value)
  if (currentWorkshop && Number(workshopForm.capacity) < currentWorkshop.bookedUserIds.length) formErrors.capacity = `Capacity cannot be lower than ${currentWorkshop.bookedUserIds.length} existing bookings.`
  if (workshopForm.description.trim().length < 20) formErrors.description = 'Use at least 20 characters for the description.'
  return !Object.values(formErrors).some(Boolean)
}

function resetWorkshopForm() {
  editingWorkshopId.value = null
  Object.assign(workshopForm, { title: '', type: 'Health orientation', date: '', time: '', location: '', language: 'English', capacity: 20, description: '' })
  Object.keys(formErrors).forEach((key) => { formErrors[key] = '' })
}

function saveWorkshop() {
  if (authState.currentUser?.role !== 'staff' || !validateWorkshop()) return
  const workshopDetails = { title: workshopForm.title.trim().slice(0, 80), type: workshopForm.type, date: workshopForm.date, time: workshopForm.time, location: workshopForm.location.trim().slice(0, 100), language: workshopForm.language, capacity: Number(workshopForm.capacity), description: workshopForm.description.trim().slice(0, 220) }

  if (editingWorkshopId.value) {
    const currentWorkshop = workshops.value.find((workshop) => workshop.id === editingWorkshopId.value)
    if (!currentWorkshop) return
    Object.assign(currentWorkshop, workshopDetails)
  } else {
    workshops.value.push({ id: crypto.randomUUID(), ...workshopDetails, bookedUserIds: [], published: false })
  }

  saveWorkshops(workshops.value)
  resetWorkshopForm()
}

function editWorkshop(workshop) {
  if (authState.currentUser?.role !== 'staff') return
  editingWorkshopId.value = workshop.id
  Object.assign(workshopForm, { title: workshop.title, type: workshop.type, date: workshop.date, time: workshop.time, location: workshop.location, language: workshop.language, capacity: workshop.capacity, description: workshop.description })
  Object.keys(formErrors).forEach((key) => { formErrors[key] = '' })
}

function togglePublished(workshop) {
  if (authState.currentUser?.role !== 'staff') return
  workshop.published = !workshop.published
  saveWorkshops(workshops.value)
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatAppointmentTime(value) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

function showAppointment(event) {
  selectedAppointmentId.value = event.extendedProps.appointmentId || event.id
}

function datedFilename(prefix) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`
}

function exportRequests() {
  if (authState.currentUser?.role !== 'staff' || !requests.value.length) return
  downloadCsv(datedFilename('studywell-support-requests'), requestExportColumns, requests.value)
}

function exportWorkshops() {
  if (authState.currentUser?.role !== 'staff' || !workshops.value.length) return
  downloadCsv(datedFilename('studywell-workshops'), workshopExportColumns, workshops.value)
}

function selectedEmailRequest() {
  return requests.value.find((request) => request.id === emailForm.requestId)
}

function prepareSupportEmail() {
  const request = selectedEmailRequest()
  emailStatus.value = ''
  if (!request) return
  emailForm.subject = `StudyWell support update: ${request.subject}`.slice(0, 120)
  emailForm.message = `Hello ${request.name},\n\nPlease find your current StudyWell support request summary attached. Its current status is ${request.status}.\n\nReply to this email if you need any clarification.`
}

function validateSupportEmail() {
  Object.keys(emailErrors).forEach((key) => { emailErrors[key] = '' })
  if (!selectedEmailRequest()) emailErrors.requestId = 'Choose a support request.'
  if (emailForm.subject.trim().length < 5) emailErrors.subject = 'Use at least 5 characters for the subject.'
  if (emailForm.message.trim().length < 20) emailErrors.message = 'Use at least 20 characters for the message.'
  return !Object.values(emailErrors).some(Boolean)
}

async function sendSupportEmail() {
  emailStatus.value = ''
  emailStatusType.value = ''
  if (authState.currentUser?.role !== 'staff' || !validateSupportEmail()) return
  if (!emailServiceConfigured) {
    emailStatus.value = 'Deploy the email function and add its URL to VITE_EMAIL_FUNCTION_URL.'
    emailStatusType.value = 'error'
    return
  }

  const request = selectedEmailRequest()
  const attachmentName = `studywell-request-${String(request.id).slice(0, 12)}.csv`
  const attachmentContent = createCsvContent(requestExportColumns, [request])
  emailSending.value = true

  try {
    await sendSupportSummaryEmail({
      toEmail: request.email,
      toName: request.name,
      subject: emailForm.subject.trim().slice(0, 120),
      message: emailForm.message.trim().slice(0, 1000),
      staffName: authState.currentUser.name,
      requestId: request.id,
      attachmentName,
      attachmentContent
    })
    emailStatus.value = `Email sent to ${request.email} with ${attachmentName} attached.`
    emailStatusType.value = 'success'
  } catch (error) {
    emailStatus.value = error?.text || error?.message || 'The email service could not send this message.'
    emailStatusType.value = 'error'
  } finally {
    emailSending.value = false
  }
}

async function generateServiceInsights() {
  insightsError.value = ''
  insightsResult.value = null

  if (authState.currentUser?.role !== 'staff') return
  if (!insightsFunctionUrl) {
    insightsError.value = 'Deploy the support insights function and add its URL to VITE_SUPPORT_INSIGHTS_FUNCTION_URL.'
    return
  }

  insightsLoading.value = true
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(insightsFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        action: 'generateServiceInsights',
        requests: requests.value.map(({ status, category }) => ({ status, category })),
        workshops: workshops.value.map(({ capacity, bookedUserIds, published }) => ({
          capacity,
          bookings: Array.isArray(bookedUserIds) ? bookedUserIds.length : 0,
          published
        }))
      })
    })
    const data = await response.json()
    if (!response.ok || !data.ok) throw new Error(data.error || 'The cloud function returned an error.')
    insightsResult.value = data
  } catch (error) {
    insightsError.value = error.name === 'AbortError'
      ? 'The cloud function took too long to respond. Please try again.'
      : error.message || 'Unable to reach the cloud function.'
  } finally {
    window.clearTimeout(timeoutId)
    insightsLoading.value = false
  }
}

onMounted(() => {
  stopAppointmentsSubscription = subscribeToAppointments({
    staff: true,
    onData: (items) => {
      appointments.value = items
      appointmentsLoading.value = false
      if (selectedAppointmentId.value && !items.some((item) => item.id === selectedAppointmentId.value)) {
        selectedAppointmentId.value = ''
      }
    },
    onError: (message) => {
      appointmentsError.value = message
      appointmentsLoading.value = false
    }
  })
})

onBeforeUnmount(() => stopAppointmentsSubscription?.())
</script>

<template>
  <section class="dashboard-hero staff-hero"><div class="container"><p class="eyebrow eyebrow-light">Staff dashboard · protected</p><h1>Coordinate student support.</h1><p>Welcome, {{ authState.currentUser?.name }}. Review requests and prepare community workshops.</p></div></section>
  <section class="section-space dashboard-page">
    <div class="container">
      <div class="staff-stats"><article><strong>{{ requestCounts.total }}</strong><span>Total requests</span></article><article><strong>{{ requestCounts.submitted }}</strong><span>Awaiting review</span></article><article><strong>{{ requestCounts.active }}</strong><span>In progress</span></article><article><strong>{{ workshops.filter((item) => item.published).length }}</strong><span>Published workshops</span></article></div>

      <section class="staff-panel appointment-management-panel">
        <div class="dashboard-heading">
          <div><p class="eyebrow">Appointment coordination</p><h2>Student support calendar</h2></div>
          <span class="appointment-count"><strong>{{ upcomingAppointmentCount }}</strong> upcoming</span>
        </div>
        <p>View every booked 30-minute support session. Select a calendar event to review the student and their notes.</p>
        <p v-if="appointmentsLoading">Loading appointments…</p>
        <p v-if="appointmentsError" class="form-alert" role="alert">{{ appointmentsError }}</p>
        <AppointmentCalendar v-if="!appointmentsLoading" :events="appointmentEvents" @select-event="showAppointment" />
        <article v-if="selectedAppointment" class="appointment-detail" aria-live="polite">
          <div>
            <p class="eyebrow">Selected appointment</p>
            <h3>{{ selectedAppointment.studentName }} · {{ selectedAppointment.type }}</h3>
            <p>{{ formatAppointmentTime(selectedAppointment.start) }}</p>
          </div>
          <dl>
            <div><dt>Student email</dt><dd>{{ selectedAppointment.studentEmail }}</dd></div>
            <div><dt>Student notes</dt><dd>{{ selectedAppointment.notes || 'No notes provided.' }}</dd></div>
          </dl>
        </article>
      </section>

      <AppointmentAnalytics class="mt-4" :appointments="appointments" />

      <section class="staff-panel cloud-insights-panel">
        <div class="dashboard-heading">
          <div><p class="eyebrow">Serverless analysis</p><h2>Service operations insight</h2></div>
          <button class="btn btn-brand btn-sm" type="button" :disabled="insightsLoading" @click="generateServiceInsights">{{ insightsLoading ? 'Analysing…' : 'Run server analysis' }}</button>
        </div>
        <p>The cloud function analyses non-sensitive request and workshop totals, then returns a prioritised action for staff.</p>
        <p v-if="insightsError" class="form-alert mb-0" role="alert">{{ insightsError }}</p>
        <div v-if="insightsResult" class="cloud-insights-result" role="status" aria-live="polite">
          <div class="cloud-insights-metrics">
            <span><strong>{{ insightsResult.overview.openRequests }}</strong> open requests</span>
            <span><strong>{{ insightsResult.overview.occupancyRate }}%</strong> workshop occupancy</span>
            <span><strong>{{ insightsResult.overview.totalBookings }}</strong> total bookings</span>
          </div>
          <p><strong>Recommended action:</strong> {{ insightsResult.recommendation }}</p>
          <small>Analysed by {{ insightsResult.platform }} at {{ formatDate(insightsResult.analysedAt) }}.</small>
        </div>
      </section>

      <section class="staff-panel email-panel">
        <div class="dashboard-heading">
          <div><p class="eyebrow">Student communication</p><h2>Email a support summary</h2></div>
          <span class="attachment-badge" aria-label="CSV attachment included">CSV attachment</span>
        </div>
        <p>Selecting a request limits the recipient to that student. StudyWell generates a CSV summary and sends it as an email attachment.</p>
        <form novalidate @submit.prevent="sendSupportEmail">
          <div class="email-form-grid">
            <div class="form-field">
              <label for="email-request">Student request</label>
              <select id="email-request" v-model="emailForm.requestId" :aria-invalid="Boolean(emailErrors.requestId)" :disabled="!requests.length || emailSending" @change="prepareSupportEmail">
                <option value="">Choose a request</option>
                <option v-for="request in requests" :key="request.id" :value="request.id">{{ request.name }} · {{ request.subject }}</option>
              </select>
              <small v-if="emailErrors.requestId" class="field-error">{{ emailErrors.requestId }}</small>
            </div>
            <div class="form-field">
              <label for="email-subject">Email subject</label>
              <input id="email-subject" v-model="emailForm.subject" maxlength="120" :aria-invalid="Boolean(emailErrors.subject)" :disabled="emailSending" />
              <small v-if="emailErrors.subject" class="field-error">{{ emailErrors.subject }}</small>
            </div>
          </div>
          <div class="form-field mt-3">
            <label for="email-message" class="d-flex justify-content-between"><span>Message</span><span>{{ emailForm.message.length }}/1000</span></label>
            <textarea id="email-message" v-model="emailForm.message" rows="5" maxlength="1000" :aria-invalid="Boolean(emailErrors.message)" :disabled="emailSending"></textarea>
            <small v-if="emailErrors.message" class="field-error">{{ emailErrors.message }}</small>
          </div>
          <div class="email-actions mt-3">
            <button class="btn btn-brand" type="submit" :disabled="!requests.length || emailSending">{{ emailSending ? 'Sending…' : 'Send email with attachment' }}</button>
            <small v-if="emailForm.requestId">The attachment contains only the selected student's request.</small>
          </div>
          <p v-if="emailStatus" :class="['email-status', `email-status-${emailStatusType}`]" role="status" aria-live="polite">{{ emailStatus }}</p>
        </form>
      </section>

      <div class="staff-grid">
        <section class="staff-panel"><div class="dashboard-heading"><div><p class="eyebrow">Student support</p><h2>Request queue</h2></div><button class="btn btn-outline-brand btn-sm" type="button" :disabled="!requests.length" @click="exportRequests">Export CSV</button></div>
          <InteractiveDataTable :rows="requests" :columns="requestColumns" caption="Support requests" empty-message="No support requests match the current search.">
            <template #cell="{ row, column }">
              <template v-if="column.key === 'student'"><strong>{{ row.name }}</strong><small>{{ row.email }}</small></template>
              <template v-else-if="column.key === 'request'"><strong>{{ row.subject }}</strong><small>{{ row.category }}</small></template>
              <select v-else-if="column.key === 'status'" :value="row.status" :aria-label="`Status for ${row.subject}`" @change="updateRequestStatus(row, $event.target.value)"><option>Submitted</option><option>In Progress</option><option>Resolved</option></select>
            </template>
          </InteractiveDataTable>
        </section>

        <section class="staff-panel"><p class="eyebrow">Workshop management</p><h2>{{ editingWorkshopId ? 'Edit workshop' : 'Create a draft' }}</h2>
          <p v-if="editingWorkshopId" class="edit-form-note">Update the workshop details below. Existing bookings and publishing status will be kept.</p>
          <form novalidate @submit.prevent="saveWorkshop">
            <div class="form-field mb-3"><label for="workshop-title">Workshop title</label><input id="workshop-title" v-model="workshopForm.title" maxlength="80" :aria-invalid="Boolean(formErrors.title)" /><small v-if="formErrors.title" class="field-error">{{ formErrors.title }}</small></div>
            <div class="row g-3"><div class="col-md-6 form-field"><label for="workshop-type">Type</label><select id="workshop-type" v-model="workshopForm.type"><option>Health orientation</option><option>Wellbeing workshop</option><option>Peer connection</option></select></div><div class="col-md-6 form-field"><label for="workshop-language">Language</label><select id="workshop-language" v-model="workshopForm.language"><option>English</option><option>English + Mandarin support</option><option>English + Hindi support</option></select></div></div>
            <div class="row g-3 mt-0"><div class="col-md-6 form-field"><label for="workshop-date">Date</label><input id="workshop-date" v-model="workshopForm.date" type="date" :aria-invalid="Boolean(formErrors.date)" /><small v-if="formErrors.date" class="field-error">{{ formErrors.date }}</small></div><div class="col-md-6 form-field"><label for="workshop-time">Time</label><input id="workshop-time" v-model="workshopForm.time" type="time" :aria-invalid="Boolean(formErrors.time)" /><small v-if="formErrors.time" class="field-error">{{ formErrors.time }}</small></div></div>
            <div class="row g-3 mt-0"><div class="col-md-8 form-field"><label for="workshop-location">Location</label><input id="workshop-location" v-model="workshopForm.location" maxlength="100" :aria-invalid="Boolean(formErrors.location)" /><small v-if="formErrors.location" class="field-error">{{ formErrors.location }}</small></div><div class="col-md-4 form-field"><label for="workshop-capacity">Capacity</label><input id="workshop-capacity" v-model.number="workshopForm.capacity" type="number" min="5" max="100" :aria-invalid="Boolean(formErrors.capacity)" /><small v-if="formErrors.capacity" class="field-error">{{ formErrors.capacity }}</small></div></div>
            <div class="form-field mt-3"><label for="workshop-description" class="d-flex justify-content-between"><span>Description</span><span>{{ workshopForm.description.length }}/220</span></label><textarea id="workshop-description" v-model="workshopForm.description" rows="4" maxlength="220" :aria-invalid="Boolean(formErrors.description)"></textarea><small v-if="formErrors.description" class="field-error">{{ formErrors.description }}</small></div>
            <div class="workshop-form-actions mt-3"><button class="btn btn-brand" type="submit">{{ editingWorkshopId ? 'Save changes' : 'Save workshop draft' }}</button><button v-if="editingWorkshopId" class="btn btn-outline-secondary" type="button" @click="resetWorkshopForm">Cancel editing</button></div>
          </form>
        </section>
      </div>

      <section class="staff-panel mt-4"><div class="dashboard-heading"><div><p class="eyebrow">Publishing</p><h2>Workshop schedule</h2></div><button class="btn btn-outline-brand btn-sm" type="button" :disabled="!workshops.length" @click="exportWorkshops">Export CSV</button></div>
        <InteractiveDataTable :rows="workshops" :columns="workshopColumns" caption="Workshop schedule" empty-message="No workshops match the current search.">
          <template #cell="{ row, column, value }">
            <template v-if="column.key === 'title'"><strong>{{ row.title }}</strong><small>{{ row.type }}</small></template>
            <template v-else-if="column.key === 'date'">{{ formatDate(row.date) }} · {{ row.time }}</template>
            <template v-else-if="column.key === 'published'"><span :class="['status-badge', row.published ? 'status-in-progress' : 'status-submitted']">{{ value }}</span></template>
            <div v-else-if="column.key === 'actions'" class="workshop-manage-actions"><button type="button" class="edit-button" @click="editWorkshop(row)">Edit</button><button type="button" :class="['publish-button', { live: row.published }]" @click="togglePublished(row)">{{ row.published ? 'Published' : 'Publish' }}</button></div>
            <template v-else>{{ value }}</template>
          </template>
        </InteractiveDataTable>
      </section>
    </div>
  </section>
</template>

<style scoped>
.appointment-management-panel > p {
  color: #5e716c;
  line-height: 1.6;
}

.appointment-count {
  padding: 8px 12px;
  color: #24594d;
  background: #eef4f1;
  border-radius: 5px;
}

.appointment-detail {
  margin-top: 18px;
  padding: 18px;
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(280px, 1.2fr);
  gap: 24px;
  background: #f7f9f8;
  border: 1px solid #d6dfdc;
  border-radius: 8px;
}

.appointment-detail h3,
.appointment-detail p {
  margin-bottom: 6px;
}

.appointment-detail dl {
  margin: 0;
}

.appointment-detail dl div + div {
  margin-top: 12px;
}

.appointment-detail dt {
  color: #5e716c;
  font-size: 13px;
  font-weight: 700;
}

.appointment-detail dd {
  margin: 3px 0 0;
  overflow-wrap: anywhere;
}

@media (max-width: 767px) {
  .appointment-detail {
    grid-template-columns: 1fr;
  }
}
</style>
