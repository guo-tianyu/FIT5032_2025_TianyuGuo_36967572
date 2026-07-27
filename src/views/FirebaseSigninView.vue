<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const email = ref('')
const password = ref('')
const role = ref('')
const message = ref('')
const errorMessage = ref('')

const userRoles = {
  'admin2-36967572@example.com': 'admin',
  'student36967572@example.com': 'student'
}

const signIn = async () => {
  message.value = ''
  errorMessage.value = ''
  role.value = ''

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    )

    const signedInEmail = userCredential.user.email
    role.value = userRoles[signedInEmail] ?? 'unassigned'

    console.log('Firebase Login Successful!')
    console.log('Current user:', {
      email: userCredential.user.email,
      uid: userCredential.user.uid
    })
    console.log('Current role:', role.value)

    message.value = `Login successful! Role: ${role.value}`
  } catch (error) {
    console.error('Firebase login error:', error.code)
    errorMessage.value = error.code
  }
}
</script>

<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h1 class="text-center mb-4">Firebase Sign In</h1>

        <form @submit.prevent="signIn">
          <div class="mb-3">
            <label for="signin-email" class="form-label">Email</label>
            <input
              id="signin-email"
              v-model="email"
              type="email"
              class="form-control"
              placeholder="Email"
              autocomplete="email"
              required
            />
          </div>

          <div class="mb-3">
            <label for="signin-password" class="form-label">
              Password
            </label>

            <input
              id="signin-password"
              v-model="password"
              type="password"
              class="form-control"
              placeholder="Password"
              autocomplete="current-password"
              required
            />
          </div>

          <div v-if="message" class="alert alert-success">
            {{ message }}
          </div>

          <div v-if="errorMessage" class="alert alert-danger">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn btn-primary w-100">
            Sign in via Firebase
          </button>
        </form>
      </div>
    </div>
  </div>
</template>