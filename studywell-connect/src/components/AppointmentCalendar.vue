<script setup>
import { computed, markRaw } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

const props = defineProps({
  events: { type: Array, default: () => [] },
  selectable: { type: Boolean, default: false }
})
const emit = defineEmits(['select-slot', 'select-event'])
const calendarPlugins = markRaw([
  markRaw(dayGridPlugin),
  markRaw(timeGridPlugin),
  markRaw(interactionPlugin)
])

const calendarOptions = computed(() => ({
  plugins: calendarPlugins,
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek'
  },
  buttonText: { today: 'Today', month: 'Month', week: 'Week' },
  events: props.events,
  weekends: false,
  nowIndicator: true,
  allDaySlot: false,
  slotMinTime: '09:00:00',
  slotMaxTime: '17:00:00',
  slotDuration: '00:30:00',
  slotLabelInterval: '01:00:00',
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '17:00'
  },
  validRange: { start: new Date().toISOString().slice(0, 10) },
  dateClick: props.selectable
    ? (information) => emit('select-slot', information)
    : undefined,
  eventClick: (information) => emit('select-event', information.event),
  eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' },
  dayHeaderFormat: { weekday: 'short', day: 'numeric', month: 'short' },
  height: 'auto'
}))
</script>

<template>
  <div class="appointment-calendar" aria-label="Support appointment calendar">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style scoped>
.appointment-calendar {
  padding: 16px;
  overflow-x: auto;
  color: #253b36;
  background: #fff;
  border: 1px solid #d6dfdc;
  border-radius: 8px;
}

:deep(.fc) {
  min-width: 680px;
  font-size: 14px;
}

:deep(.fc .fc-toolbar-title) {
  color: #123b3a;
  font-size: 20px;
}

:deep(.fc .fc-button-primary) {
  color: #fff;
  background: #24594d;
  border-color: #24594d;
}

:deep(.fc .fc-button-primary:hover),
:deep(.fc .fc-button-primary:focus),
:deep(.fc .fc-button-primary:not(:disabled).fc-button-active) {
  background: #19463c;
  border-color: #19463c;
}

:deep(.fc a) {
  color: #253b36;
  text-decoration: none;
}

:deep(.fc .fc-timegrid-slot) {
  height: 34px;
}

:deep(.fc .fc-timegrid-slot-lane:hover) {
  background: #eef4f1;
}

:deep(.fc .fc-event) {
  cursor: pointer;
}

@media (max-width: 767px) {
  .appointment-calendar {
    padding: 10px;
  }
}
</style>
