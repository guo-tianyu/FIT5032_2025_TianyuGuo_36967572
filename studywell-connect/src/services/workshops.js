import { STORAGE_KEYS, readStorage, writeStorage } from './storage'

const initialWorkshops = [
  {
    id: 'workshop-healthcare-101',
    title: 'Healthcare in Australia 101',
    type: 'Health orientation',
    date: '2026-08-08',
    time: '10:30',
    location: 'Study Melbourne Hub',
    language: 'English',
    capacity: 24,
    bookedUserIds: [],
    published: true,
    description: 'Understand OSHC, GP appointments, pharmacies, referrals and where to seek urgent help.'
  },
  {
    id: 'workshop-study-calm',
    title: 'Study Calm: stress and steady routines',
    type: 'Wellbeing workshop',
    date: '2026-08-15',
    time: '13:00',
    location: 'Carlton Community Room',
    language: 'English + Mandarin support',
    capacity: 18,
    bookedUserIds: [],
    published: true,
    description: 'Practise simple ways to notice overload, reset routines and ask for support before stress builds.'
  },
  {
    id: 'workshop-connections',
    title: 'New city, new connections',
    type: 'Peer connection',
    date: '2026-08-22',
    time: '11:00',
    location: 'Footscray Learning Centre',
    language: 'English',
    capacity: 16,
    bookedUserIds: [],
    published: true,
    description: 'A friendly small-group session about loneliness, belonging and finding communities that feel right.'
  }
]

export function getWorkshops() {
  const stored = readStorage(STORAGE_KEYS.workshops, null)
  if (Array.isArray(stored)) return stored
  writeStorage(STORAGE_KEYS.workshops, initialWorkshops)
  return structuredClone(initialWorkshops)
}

export function saveWorkshops(workshops) {
  writeStorage(STORAGE_KEYS.workshops, workshops)
}
