<script setup>
import { nextTick, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login, registerStudent } from '@/services/auth'

const router = useRouter()
const route = useRoute()
const mode = ref(route.query.mode === 'register' ? 'register' : 'login')
const busy = ref(false)
const formMessage = ref('')
const loginTab = ref(null)
const registerTab = ref(null)
const loginData = reactive({ email: '', password: '' })
const registerData = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const loginErrors = reactive({ email: '', password: '' })
const registerErrors = reactive({ name: '', email: '', password: '', confirmPassword: '' })

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function setMode(nextMode, focusTab = false) {
  mode.value = nextMode
  formMessage.value = ''
  if (focusTab) {
    nextTick(() => (nextMode === 'login' ? loginTab.value : registerTab.value)?.focus())
  }
}

function handleTabKeydown(event) {
  let nextMode = mode.value
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextMode = mode.value === 'login' ? 'register' : 'login'
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextMode = mode.value === 'login' ? 'register' : 'login'
  else if (event.key === 'Home') nextMode = 'login'
  else if (event.key === 'End') nextMode = 'register'
  else return

  event.preventDefault()
  setMode(nextMode, true)
}

function passwordValidationMessage(password) {
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (password.length > 20) return 'Password must be 20 characters or fewer.'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
  if (!/\d/.test(password)) return 'Password must contain at least one number.'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character.'
  return ''
}

function validateRegistrationPassword(showError) {
  const message = passwordValidationMessage(registerData.password)
  if (showError || !message) registerErrors.password = message
}

function validateConfirmPassword(showError) {
  const message = registerData.confirmPassword === registerData.password ? '' : 'Passwords do not match.'
  if (showError || !message) registerErrors.confirmPassword = message
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
  if (Object.values(loginErrors).some(Boolean)) {
    await nextTick()
    document.querySelector('#login-panel [aria-invalid="true"]')?.focus()
    return
  }

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
  registerErrors.password = passwordValidationMessage(registerData.password)
  registerErrors.confirmPassword = registerData.confirmPassword === registerData.password ? '' : 'Passwords do not match.'
  if (Object.values(registerErrors).some(Boolean)) {
    await nextTick()
    document.querySelector('#register-panel [aria-invalid="true"]')?.focus()
    return
  }

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
          <button id="login-tab" ref="loginTab" type="button" :class="{ active: mode === 'login' }" role="tab" aria-controls="login-panel" :aria-selected="mode === 'login'" :tabindex="mode === 'login' ? 0 : -1" @click="setMode('login')" @keydown="handleTabKeydown">Sign in</button>
          <button id="register-tab" ref="registerTab" type="button" :class="{ active: mode === 'register' }" role="tab" aria-controls="register-panel" :aria-selected="mode === 'register'" :tabindex="mode === 'register' ? 0 : -1" @click="setMode('register')" @keydown="handleTabKeydown">Create account</button>
        </div>

        <div v-if="formMessage" class="form-alert" role="alert">{{ formMessage }}</div>

        <form v-if="mode === 'login'" id="login-panel" role="tabpanel" aria-labelledby="login-tab" novalidate @submit.prevent="submitLogin">
          <div class="form-heading"><p class="eyebrow">Welcome back</p><h2>Sign in to StudyWell</h2><p>Use your student or staff account.</p></div>
          <div class="form-field mb-3"><label for="login-email">Email address</label><input id="login-email" v-model="loginData.email" type="email" maxlength="120" autocomplete="email" :aria-invalid="Boolean(loginErrors.email)" :aria-describedby="loginErrors.email ? 'login-email-error' : undefined" /><small v-if="loginErrors.email" id="login-email-error" class="field-error">{{ loginErrors.email }}</small></div>
          <div class="form-field mb-3"><label for="login-password">Password</label><input id="login-password" v-model="loginData.password" type="password" maxlength="20" autocomplete="current-password" :aria-invalid="Boolean(loginErrors.password)" :aria-describedby="loginErrors.password ? 'login-password-error' : undefined" /><small v-if="loginErrors.password" id="login-password-error" class="field-error">{{ loginErrors.password }}</small></div>
          <button class="btn btn-brand btn-lg w-100" type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
          <p class="field-hint mt-3 mb-0">Accounts are protected by Firebase Authentication. Staff access is issued by an administrator.</p>
        </form>

        <form v-else id="register-panel" role="tabpanel" aria-labelledby="register-tab" novalidate @submit.prevent="submitRegistration">
          <div class="form-heading"><p class="eyebrow">Free student account</p><h2>Join StudyWell</h2><p>Public registration creates a Student account.</p></div>
          <div class="form-field mb-3"><label for="register-name">Full name</label><input id="register-name" v-model="registerData.name" type="text" maxlength="60" autocomplete="name" :aria-invalid="Boolean(registerErrors.name)" :aria-describedby="registerErrors.name ? 'register-name-error' : undefined" /><small v-if="registerErrors.name" id="register-name-error" class="field-error">{{ registerErrors.name }}</small></div>
          <div class="form-field mb-3"><label for="register-email">Email address</label><input id="register-email" v-model="registerData.email" type="email" maxlength="120" autocomplete="email" :aria-invalid="Boolean(registerErrors.email)" :aria-describedby="registerErrors.email ? 'register-email-error' : undefined" /><small v-if="registerErrors.email" id="register-email-error" class="field-error">{{ registerErrors.email }}</small></div>
          <div class="form-field mb-3"><label for="register-password">Password</label><input id="register-password" v-model="registerData.password" type="password" maxlength="20" autocomplete="new-password" :aria-invalid="Boolean(registerErrors.password)" :aria-describedby="registerErrors.password ? 'register-password-error' : 'register-password-hint'" @blur="validateRegistrationPassword(true)" @input="validateRegistrationPassword(false)" /><small v-if="registerErrors.password" id="register-password-error" class="field-error">{{ registerErrors.password }}</small><small v-else id="register-password-hint" class="field-hint">8–20 characters with uppercase, lowercase, a number and a symbol.</small></div>
          <div class="form-field mb-3"><label for="register-confirm">Confirm password</label><input id="register-confirm" v-model="registerData.confirmPassword" type="password" maxlength="20" autocomplete="new-password" :aria-invalid="Boolean(registerErrors.confirmPassword)" :aria-describedby="registerErrors.confirmPassword ? 'register-confirm-error' : undefined" @blur="validateConfirmPassword(true)" @input="validateConfirmPassword(false)" /><small v-if="registerErrors.confirmPassword" id="register-confirm-error" class="field-error">{{ registerErrors.confirmPassword }}</small></div>
          <button class="btn btn-brand btn-lg w-100" type="submit" :disabled="busy">{{ busy ? 'Creating account…' : 'Create student account' }}</button>
        </form>
      </div>
    </div>
  </section>
</template>
