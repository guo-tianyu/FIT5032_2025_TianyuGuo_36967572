<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  appointments: {
    type: Array,
    default: () => []
  }
})

const range = ref('upcoming')
const grouping = ref('type')
const selectedKey = ref('')

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const supportTypes = [
  'Personal wellbeing',
  'Healthcare guidance',
  'Study stress',
  'Social connection'
]

const filteredAppointments = computed(() => {
  if (range.value === 'all') return props.appointments
  const now = new Date()
  return props.appointments.filter((appointment) => new Date(appointment.end) > now)
})

const chartData = computed(() => {
  const labels = grouping.value === 'type'
    ? supportTypes
    : weekdayLabels.slice(1, 6)

  const counts = new Map(labels.map((label) => [label, 0]))
  filteredAppointments.value.forEach((appointment) => {
    const key = grouping.value === 'type'
      ? appointment.type
      : weekdayLabels[new Date(appointment.start).getDay()]
    if (counts.has(key)) counts.set(key, counts.get(key) + 1)
  })

  const highest = Math.max(1, ...counts.values())
  return labels.map((label) => ({
    key: label,
    label,
    shortLabel: grouping.value === 'type'
      ? label.replace('Personal ', '').replace('Healthcare ', '').replace('Social ', '')
      : label.slice(0, 3),
    count: counts.get(label),
    percentage: (counts.get(label) / highest) * 100
  }))
})

const selectedDatum = computed(() => chartData.value.find((item) => item.key === selectedKey.value))
const busiestDatum = computed(() => chartData.value.reduce(
  (busiest, item) => item.count > busiest.count ? item : busiest,
  { label: 'No bookings yet', count: 0 }
))

watch([range, grouping], () => {
  selectedKey.value = ''
})
</script>

<template>
  <section class="analytics" aria-labelledby="appointment-analytics-title">
    <div class="analytics-toolbar">
      <div>
        <p class="eyebrow">Firestore live data</p>
        <h2 id="appointment-analytics-title">Appointment demand</h2>
        <p>Explore booking demand by support area or weekday.</p>
      </div>

      <div class="analytics-controls" aria-label="Chart controls">
        <fieldset>
          <legend>Time range</legend>
          <div class="segmented-control">
            <button type="button" :aria-pressed="range === 'upcoming'" @click="range = 'upcoming'">Upcoming</button>
            <button type="button" :aria-pressed="range === 'all'" @click="range = 'all'">All</button>
          </div>
        </fieldset>
        <fieldset>
          <legend>Group by</legend>
          <div class="segmented-control">
            <button type="button" :aria-pressed="grouping === 'type'" @click="grouping = 'type'">Support area</button>
            <button type="button" :aria-pressed="grouping === 'weekday'" @click="grouping = 'weekday'">Weekday</button>
          </div>
        </fieldset>
      </div>
    </div>

    <div class="chart-summary" aria-live="polite">
      <span><strong>{{ filteredAppointments.length }}</strong> appointments shown</span>
      <span v-if="selectedDatum"><strong>{{ selectedDatum.count }}</strong> for {{ selectedDatum.label }}</span>
      <span v-else-if="busiestDatum.count"><strong>{{ busiestDatum.label }}</strong> has the highest demand</span>
      <span v-else>No booking data in this range</span>
    </div>

    <div class="bar-chart" role="group" :aria-label="`Appointment chart showing ${filteredAppointments.length} bookings grouped by ${grouping === 'type' ? 'support area' : 'weekday'}`">
      <div v-for="item in chartData" :key="item.key" class="bar-column">
        <span class="bar-value">{{ item.count }}</span>
        <button
          type="button"
          class="bar-track"
          :class="{ selected: selectedKey === item.key }"
          :aria-label="`${item.label}: ${item.count} appointment${item.count === 1 ? '' : 's'}`"
          :aria-pressed="selectedKey === item.key"
          @click="selectedKey = selectedKey === item.key ? '' : item.key"
        >
          <span class="bar-fill" :style="{ height: `${item.percentage}%` }"></span>
        </button>
        <span class="bar-label" :title="item.label">{{ item.shortLabel }}</span>
      </div>
    </div>

    <p class="chart-note">Select a bar to inspect it. Counts update automatically when Firestore appointment data changes.</p>
  </section>
</template>

<style scoped>
.analytics {
  padding: 28px;
  background: #fff;
  border: 1px solid #d6dfdc;
  border-radius: 8px;
}

.analytics-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
}

.analytics-toolbar h2,
.analytics-toolbar p {
  margin-bottom: 6px;
}

.analytics-toolbar > div:first-child > p:last-child,
.chart-note {
  color: #5e716c;
}

.analytics-controls {
  display: flex;
  gap: 18px;
}

.analytics-controls fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

.analytics-controls legend {
  margin-bottom: 6px;
  color: #405a53;
  font-size: 13px;
  font-weight: 700;
}

.segmented-control {
  display: flex;
  padding: 3px;
  background: #eef4f1;
  border-radius: 6px;
}

.segmented-control button {
  padding: 7px 10px;
  color: #24594d;
  background: transparent;
  border: 0;
  border-radius: 4px;
  font-weight: 700;
}

.segmented-control button[aria-pressed='true'] {
  color: #fff;
  background: #24594d;
}

.segmented-control button:focus-visible,
.bar-track:focus-visible {
  outline: 3px solid #123b3a;
  outline-offset: 3px;
  box-shadow: 0 0 0 3px #fff;
}

.chart-summary {
  min-height: 48px;
  margin-top: 22px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  background: #f7f9f8;
  border-radius: 6px;
}

.bar-chart {
  height: 300px;
  margin-top: 24px;
  padding: 20px 16px 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  align-items: end;
  gap: 20px;
  border-bottom: 2px solid #9baca7;
  background: repeating-linear-gradient(to top, transparent 0, transparent 73px, #e8eeec 74px, transparent 75px);
}

.bar-column {
  height: 100%;
  display: grid;
  grid-template-rows: 24px 1fr 42px;
  align-items: end;
  text-align: center;
}

.bar-value {
  align-self: start;
  color: #405a53;
  font-weight: 800;
}

.bar-track {
  width: min(82px, 80%);
  height: 100%;
  margin: 0 auto;
  padding: 0;
  display: flex;
  align-items: flex-end;
  background: #eef4f1;
  border: 1px solid #c7d5d1;
  border-radius: 6px 6px 0 0;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  min-height: 3px;
  background: #3f7d6e;
  transition: height 180ms ease, background 180ms ease;
}

.bar-track:hover .bar-fill,
.bar-track.selected .bar-fill {
  background: #b75f49;
}

.bar-label {
  align-self: center;
  color: #405a53;
  font-size: 13px;
  font-weight: 700;
}

.chart-note {
  margin: 14px 0 0;
  font-size: 14px;
}

@media (max-width: 767px) {
  .analytics {
    padding: 20px;
  }

  .analytics-toolbar,
  .analytics-controls,
  .chart-summary {
    flex-direction: column;
  }

  .analytics-controls {
    width: 100%;
  }

  .bar-chart {
    height: 250px;
    padding-inline: 6px;
    gap: 6px;
  }

  .bar-track {
    width: 70%;
  }
}
</style>
