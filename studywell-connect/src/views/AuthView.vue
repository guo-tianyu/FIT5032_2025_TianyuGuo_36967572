<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login, registerStudent } from '@/services/auth'

const router = useRouter()
const route = useRoute()
const mode = ref(route.query.mode === 'register' ? 'register' : 'login')
const busy = ref(false)
const formMessage = ref('')
const loginData = reactive({ email: '', password: '' })
const registerData = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const loginErrors = reactive({ email: '', password: '' })
const registerErrors = reactive({ name: '', email: '', password: '', confirmPassword: '' })

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function setMode(nextMode) {
  mode.value = nextMode
  formMessage.value = ''
}

function validPassword(password) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
}

function clearObject(object) {
  Object.keys(object).forEach((key) => { object[key] = '' })
}

function destinationFor(user) {
  const requested = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  if (requested.startsWith('/') && !requested.startsWith('//')) return requested
  return user.role === 'staff' ? '/staff' : '/student'
}

async function submitLogin() {
  clearObject(loginErrors)
  formMessage.value = ''
  if (!emailPattern.test(loginData.email.trim())) loginErrors.email = 'Enter a valid email address.'
  if (!loginData.password) loginErrors.password = 'Enter your password.'
  if (Object.values(loginErrors).some(Boolean)) return

  busy.value = true
  const result = await login(loginData.email, loginData.password)
  busy.value = false
  if (!result.ok) {
    formMessage.value = result.message
    return
  }
  router.push(destinationFor(result.user))
}

async function submitRegistration() {
  clearObject(registerErrors)
  formMessage.value = ''
  if (registerData.name.trim().length < 2) registerErrors.name = 'Enter your name using at least 2 characters.'
  if (!emailPattern.test(registerData.email.trim())) registerErrors.email = 'Enter a valid email address.'
  if (!validPassword(registerData.password)) registerErrors.password = 'Use 8+ characters with uppercase, lowercase, a number and a symbol.'
  if (registerData.confirmPassword !== registerData.password) registerErrors.confirmPassword = 'Passwords do not match.'
  if (Object.values(registerErrors).some(Boolean)) return

  busy.value = true
  const result = await registerStudent(registerData)
  busy.value = false
  if (!result.ok) {
    formMessage.value = result.message
    return
  }
  router.push('/student')
}
</script>

<template>
  <section class="auth-page">
    <div class="container auth-layout">
      <div class="auth-story">
        <p class="eyebrow eyebrow-light">Your StudyWell space</p>
        <h1>Keep helpful support close.</h1>
        <p>Save resources, follow support requests, manage workshop bookings and share ratings from one private student space.</p>
        <ul><li>Save useful health guides</li><li>Track your support requests</li><li>Book free student workshops</li></ul>
      </div>

      <div class="auth-card">
        <div class="auth-tabs" role="tablist" aria-label="Account options">
          <button type="button" :class="{ active: mode === 'login' }" role="tab" :aria-selected="mode === 'login'" @click="setMode('login')">Sign in</button>
          <button type="button" :class="{ active: mode === 'register' }" role="tab" :aria-selected="mode === 'register'" @click="setMode('register')">Create account</button>
        </div>

        <div v-if="formMessage" class="form-alert" role="alert">{{ formMessage }}</div>

        <form v-if="mode === 'login'" novalidate @submit.prevent="submitLogin">
          <div class="form-heading"><p class="eyebrow">Welcome back</p><h2>Sign in to StudyWell</h2><p>Use your student or staff account.</p></div>
          <div class="form-field mb-3"><label for="login-email">Email address</label><input id="login-email" v-model="loginData.email" type="email" maxlength="120" autocomplete="email" :aria-invalid="Boolean(loginErrors.email)" /><small v-if="loginErrors.email" class="field-error">{{ loginErrors.email }}</small></div>
          <div class="form-field mb-3"><label for="login-password">Password</label><input id="login-password" v-model="loginData.password" type="password" maxlength="72" autocomplete="current-password" :aria-invalid="Boolean(loginErrors.password)" /><small v-if="loginErrors.password" class="field-error">{{ loginErrors.password }}</small></div>
          <button class="btn btn-brand btn-lg w-100" type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
          <details class="demo-details"><summary>Demonstration accounts</summary><p><strong>Student:</strong> student@studywell.demo / Student123!</p><p><strong>Staff:</strong> staff@studywell.demo / Staff123!</p></details>
        </form>

        <form v-else novalidate @submit.prevent="submitRegistration">
          <div class="form-heading"><p class="eyebrow">Free student account</p><h2>Join StudyWell</h2><p>Public registration creates a Student account.</p></div>
          <div class="form-field mb-3"><label for="register-name">Full name</label><input id="register-name" v-model="registerData.name" type="text" maxlength="60" autocomplete="name" :aria-invalid="Boolean(registerErrors.name)" /><small v-if="registerErrors.name" class="field-error">{{ registerErrors.name }}</small></div>
          <div class="form-field mb-3"><label for="register-email">Email address</label><input id="register-email" v-model="registerData.email" type="email" maxlength="120" autocomplete="email" :aria-invalid="Boolean(registerErrors.email)" /><small v-if="registerErrors.email" class="field-error">{{ registerErrors.email }}</small></div>
          <div class="form-field mb-3"><label for="register-password">Password</label><input id="register-password" v-model="registerData.password" type="password" maxlength="72" autocomplete="new-password" :aria-invalid="Boolean(registerErrors.password)" /><small v-if="registerErrors.password" class="field-error">{{ registerErrors.password }}</small><small v-else class="field-hint">8+ characters with uppercase, lowercase, a number and a symbol.</small></div>
          <div class="form-field mb-3"><label for="register-confirm">Confirm password</label><input id="register-confirm" v-model="registerData.confirmPassword" type="password" maxlength="72" autocomplete="new-password" :aria-invalid="Boolean(registerErrors.confirmPassword)" /><small v-if="registerErrors.confirmPassword" class="field-error">{{ registerErrors.confirmPassword }}</small></div>
          <button class="btn btn-brand btn-lg w-100" type="submit" :disabled="busy">{{ busy ? 'Creating account…' : 'Create student account' }}</button>
        </form>
      </div>
    </div>
  </section>
</template>
