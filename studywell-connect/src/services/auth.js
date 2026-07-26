import { computed, reactive } from 'vue'
import { STORAGE_KEYS, readStorage, writeStorage } from './storage'

export const authState = reactive({
  ready: false,
  currentUser: null
})

export const isAuthenticated = computed(() => Boolean(authState.currentUser))
export const isStudent = computed(() => authState.currentUser?.role === 'student')
export const isStaff = computed(() => authState.currentUser?.role === 'staff')

function readUsers() {
  const users = readStorage(STORAGE_KEYS.users, [])
  return Array.isArray(users) ? users : []
}

function publicUser(user) {
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

function createDemoUser(name, email, password, role) {
  return {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    password,
    createdAt: new Date().toISOString()
  }
}

export async function initialiseAuth() {
  const users = readUsers()
  if (!users.some((user) => user.email === 'student@studywell.demo')) {
    users.push(createDemoUser('Lina Chen', 'student@studywell.demo', 'Student123!', 'student'))
  }
  if (!users.some((user) => user.email === 'staff@studywell.demo')) {
    users.push(createDemoUser('Sarah Nguyen', 'staff@studywell.demo', 'Staff123!', 'staff'))
  }
  writeStorage(STORAGE_KEYS.users, users)

  const session = readStorage(STORAGE_KEYS.session, null)
  const signedInUser = session?.userId ? users.find((user) => user.id === session.userId) : null
  authState.currentUser = publicUser(signedInUser)
  authState.ready = true
}

export async function registerStudent({ name, email, password }) {
  const users = readUsers()
  const normalisedEmail = email.trim().toLowerCase()
  if (users.some((user) => user.email === normalisedEmail)) {
    return { ok: false, message: 'An account with this email already exists.' }
  }

  const user = createDemoUser(name.trim().slice(0, 60), normalisedEmail.slice(0, 120), password, 'student')
  users.push(user)
  writeStorage(STORAGE_KEYS.users, users)
  writeStorage(STORAGE_KEYS.session, { userId: user.id, signedInAt: new Date().toISOString() })
  authState.currentUser = publicUser(user)
  return { ok: true, user: authState.currentUser }
}

export async function login(email, password) {
  const users = readUsers()
  const user = users.find((item) => item.email === email.trim().toLowerCase())
  if (!user) return { ok: false, message: 'Email or password is incorrect.' }

  if (password !== user.password) return { ok: false, message: 'Email or password is incorrect.' }

  writeStorage(STORAGE_KEYS.session, { userId: user.id, signedInAt: new Date().toISOString() })
  authState.currentUser = publicUser(user)
  return { ok: true, user: authState.currentUser }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.session)
  authState.currentUser = null
}
