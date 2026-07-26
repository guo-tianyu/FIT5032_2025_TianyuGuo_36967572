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

function createSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password, salt) {
  const encodedPassword = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', encodedPassword)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function createDemoUser(name, email, password, role) {
  const salt = createSalt()
  return {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    salt,
    passwordHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString()
  }
}

export async function initialiseAuth() {
  const users = readUsers()
  let usersChanged = false

  for (const user of users) {
    if (typeof user.password === 'string' && (!user.salt || !user.passwordHash)) {
      user.salt = createSalt()
      user.passwordHash = await hashPassword(user.password, user.salt)
      delete user.password
      usersChanged = true
    }
  }

  if (!users.some((user) => user.email === 'student@studywell.demo')) {
    users.push(await createDemoUser('Lina Chen', 'student@studywell.demo', 'Student123!', 'student'))
    usersChanged = true
  }
  if (!users.some((user) => user.email === 'staff@studywell.demo')) {
    users.push(await createDemoUser('Sarah Nguyen', 'staff@studywell.demo', 'Staff123!', 'staff'))
    usersChanged = true
  }
  if (usersChanged) writeStorage(STORAGE_KEYS.users, users)

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

  const user = await createDemoUser(name.trim().slice(0, 60), normalisedEmail.slice(0, 120), password, 'student')
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

  if (!user.salt || !user.passwordHash) return { ok: false, message: 'Email or password is incorrect.' }
  const attemptedHash = await hashPassword(password, user.salt)
  if (attemptedHash !== user.passwordHash) return { ok: false, message: 'Email or password is incorrect.' }

  writeStorage(STORAGE_KEYS.session, { userId: user.id, signedInAt: new Date().toISOString() })
  authState.currentUser = publicUser(user)
  return { ok: true, user: authState.currentUser }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.session)
  authState.currentUser = null
}
