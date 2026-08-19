import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where
} from 'firebase/firestore'
import { firestore } from './firebase'

export const APPOINTMENT_TYPES = [
  'Personal wellbeing',
  'Healthcare guidance',
  'Study stress',
  'Social connection'
]

const APPOINTMENT_MINUTES = 30
const OPENING_HOUR = 9
const CLOSING_HOUR = 17

function appointmentError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function validateStartTime(start) {
  const startDate = new Date(start)
  const endDate = new Date(startDate.getTime() + APPOINTMENT_MINUTES * 60 * 1000)
  const day = startDate.getDay()
  const minutes = startDate.getHours() * 60 + startDate.getMinutes()

  if (Number.isNaN(startDate.getTime()) || startDate <= new Date()) {
    throw appointmentError('appointment/invalid-time', 'Choose a future appointment time.')
  }
  if (day === 0 || day === 6) {
    throw appointmentError('appointment/closed', 'Appointments are available Monday to Friday only.')
  }
  if (![0, 30].includes(startDate.getMinutes()) || startDate.getSeconds() !== 0) {
    throw appointmentError('appointment/invalid-time', 'Choose a 30-minute calendar time slot.')
  }
  if (minutes < OPENING_HOUR * 60 || minutes + APPOINTMENT_MINUTES > CLOSING_HOUR * 60) {
    throw appointmentError('appointment/closed', 'Appointments are available from 9:00 am to 5:00 pm.')
  }

  return { startDate, endDate }
}

function slotDocumentId(startDate) {
  return `slot_${startDate.toISOString().replace(/[:.]/g, '-')}`
}

function mapAppointment(snapshot) {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    ...data,
    start: data.startAt.toDate().toISOString(),
    end: data.endAt.toDate().toISOString()
  }
}

export function subscribeToAppointments({ userId, staff = false, onData, onError }) {
  const appointmentsRef = collection(firestore, 'appointments')
  const appointmentsQuery = staff
    ? appointmentsRef
    : query(appointmentsRef, where('studentId', '==', userId))

  return onSnapshot(
    appointmentsQuery,
    (snapshot) => {
      const appointments = snapshot.docs
        .map(mapAppointment)
        .sort((first, second) => new Date(first.start) - new Date(second.start))
      onData(appointments)
    },
    () => onError?.('Appointments could not be loaded. Please try again.')
  )
}

export async function bookAppointment({ student, type, notes, start }) {
  if (!student?.id || student.role !== 'student') {
    throw appointmentError('appointment/unauthorised', 'Only student accounts can book appointments.')
  }
  if (!APPOINTMENT_TYPES.includes(type)) {
    throw appointmentError('appointment/invalid-type', 'Choose a valid appointment type.')
  }

  const { startDate, endDate } = validateStartTime(start)
  const studentAppointments = await getDocs(
    query(collection(firestore, 'appointments'), where('studentId', '==', student.id))
  )
  const hasStudentConflict = studentAppointments.docs.some((snapshot) => {
    const appointment = snapshot.data()
    return appointment.startAt.toDate() < endDate && appointment.endAt.toDate() > startDate
  })

  if (hasStudentConflict) {
    throw appointmentError('appointment/student-conflict', 'You already have an appointment during this time.')
  }

  const appointmentRef = doc(firestore, 'appointments', slotDocumentId(startDate))
  try {
    await setDoc(appointmentRef, {
      studentId: student.id,
      studentName: String(student.name || 'Student').trim().slice(0, 60),
      studentEmail: String(student.email || '').trim().toLowerCase().slice(0, 120),
      type,
      notes: String(notes || '').trim().slice(0, 240),
      startAt: Timestamp.fromDate(startDate),
      endAt: Timestamp.fromDate(endDate),
      createdAt: serverTimestamp()
    })
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw appointmentError('appointment/slot-taken', 'This time is no longer available. Choose another slot.')
    }
    throw error
  }
}

export async function cancelAppointment(appointmentId) {
  if (!appointmentId) return
  await deleteDoc(doc(firestore, 'appointments', appointmentId))
}
