export const DEMO_RECORD_PREFIX = 'assessment-demo-'

const requestCategories = [
  'Understanding OSHC',
  'Finding a GP',
  'Mental wellbeing',
  'Urgent care guidance',
  'Other student support'
]

const requestSubjects = [
  'Understanding my OSHC cover',
  'Finding a local bulk-billing GP',
  'Support with study stress',
  'After-hours healthcare options',
  'Connecting with other students',
  'Booking a first GP appointment',
  'Understanding a medical referral',
  'Wellbeing support before exams',
  'Finding a nearby pharmacy',
  'Accessing multilingual support',
  'Choosing the right support service'
]

const workshopTitles = [
  'Healthcare in Australia essentials',
  'Study calm and steady routines',
  'Making connections in a new city',
  'Understanding OSHC claims',
  'Finding and visiting a GP',
  'Wellbeing tools before exams',
  'Navigating urgent and after-hours care',
  'Healthy routines for busy students',
  'Starting conversations about support',
  'Community services in Melbourne',
  'Planning your personal support network'
]

function dateValue(dayOffset) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + dayOffset)
  return date.toLocaleDateString('en-CA')
}

export function createAssessmentDemoRequests() {
  return requestSubjects.map((subject, index) => ({
    id: `${DEMO_RECORD_PREFIX}request-${String(index + 1).padStart(2, '0')}`,
    userId: `${DEMO_RECORD_PREFIX}student-${String(index + 1).padStart(2, '0')}`,
    name: `Demo Student ${String(index + 1).padStart(2, '0')}`,
    email: `demo.student${String(index + 1).padStart(2, '0')}@example.com`,
    category: requestCategories[index % requestCategories.length],
    subject,
    description: 'Assessment demonstration record used to show table searching, sorting, pagination and CSV export.',
    status: ['Submitted', 'In Progress', 'Resolved'][index % 3],
    createdAt: new Date(Date.now() - index * 86400000).toISOString()
  }))
}

export function createAssessmentDemoWorkshops() {
  return workshopTitles.map((title, index) => ({
    id: `${DEMO_RECORD_PREFIX}workshop-${String(index + 1).padStart(2, '0')}`,
    title,
    type: ['Health orientation', 'Wellbeing workshop', 'Peer connection'][index % 3],
    date: dateValue(index + 7),
    time: index % 2 ? '13:30' : '10:00',
    location: ['Study Melbourne Hub', 'Clayton Community Room', 'Online support room'][index % 3],
    language: index % 3 === 1 ? 'English + Mandarin support' : 'English',
    capacity: 20 + (index % 4) * 5,
    bookedUserIds: Array.from({ length: index % 6 }, (_, bookingIndex) => `${DEMO_RECORD_PREFIX}booking-${index}-${bookingIndex}`),
    published: index % 3 !== 2,
    description: 'Assessment demonstration workshop used to verify interactive table and export requirements.'
  }))
}

export function mergeAssessmentDemoRecords(existingRecords, demoRecords) {
  const demoIds = new Set(demoRecords.map(({ id }) => id))
  return [...existingRecords.filter(({ id }) => !demoIds.has(id)), ...demoRecords]
}

export function removeAssessmentDemoRecords(records) {
  return records.filter(({ id }) => !String(id).startsWith(DEMO_RECORD_PREFIX))
}
