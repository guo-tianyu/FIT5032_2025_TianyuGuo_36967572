import { computed, reactive } from 'vue'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firebaseAuth, firestore } from './firebase'

export const authState = reactive({
  ready: false,
  currentUser: null
})

export const isAuthenticated = computed(() => Boolean(authState.currentUser))
export const isStudent = computed(() => authState.currentUser?.role === 'student')
export const isStaff = computed(() => authState.currentUser?.role === 'staff')

let initialAuthPromise

function friendlyAuthError(error) {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'Unable to reach Firebase. Check your internet connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/user-disabled': 'This account has been disabled. Please contact StudyWell support.',
    'auth/weak-password': 'Choose a stronger password before creating your account.'
  }

  return messages[error?.code] || 'Authentication is temporarily unavailable. Please try again.'
}

async function getUserProfile(firebaseUser) {
  const profileSnapshot = await getDoc(doc(firestore, 'users', firebaseUser.uid))
  if (!profileSnapshot.exists()) return null

  const profile = profileSnapshot.data()
  const role = profile.role === 'staff' ? 'staff' : 'student'

  return {
    id: firebaseUser.uid,
    name: String(profile.name || firebaseUser.displayName || 'StudyWell member'),
    email: firebaseUser.email || String(profile.email || ''),
    role
  }
}

export function initialiseAuth() {
  if (initialAuthPromise) return initialAuthPromise

  initialAuthPromise = new Promise((resolve) => {
    let initialStateHandled = false

    onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      try {
        authState.currentUser = firebaseUser ? await getUserProfile(firebaseUser) : null
      } catch {
        authState.currentUser = null
      } finally {
        authState.ready = true
        if (!initialStateHandled) {
          initialStateHandled = true
          resolve()
        }
      }
    })
  })

  return initialAuthPromise
}

export async function registerStudent({ name, email, password }) {
  let credential
  const normalisedName = name.trim().slice(0, 60)
  const normalisedEmail = email.trim().toLowerCase().slice(0, 120)

  try {
    credential = await createUserWithEmailAndPassword(firebaseAuth, normalisedEmail, password)
    await updateProfile(credential.user, { displayName: normalisedName })
    await setDoc(doc(firestore, 'users', credential.user.uid), {
      uid: credential.user.uid,
      name: normalisedName,
      email: normalisedEmail,
      role: 'student',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    authState.currentUser = {
      id: credential.user.uid,
      name: normalisedName,
      email: normalisedEmail,
      role: 'student'
    }

    return { ok: true, user: authState.currentUser }
  } catch (error) {
    if (credential?.user) {
      try {
        await deleteUser(credential.user)
      } catch {
        // Firebase may already have ended the new session; the original error is more useful.
      }
    }
    return { ok: false, message: friendlyAuthError(error) }
  }
}

export async function login(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim().toLowerCase(), password)
    const user = await getUserProfile(credential.user)

    if (!user) {
      await signOut(firebaseAuth)
      return { ok: false, message: 'Your account profile is not configured. Please contact StudyWell support.' }
    }

    authState.currentUser = user
    return { ok: true, user }
  } catch (error) {
    return { ok: false, message: friendlyAuthError(error) }
  }
}

export async function logout() {
  await signOut(firebaseAuth)
  authState.currentUser = null
}
