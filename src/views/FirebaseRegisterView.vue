<script setup>
import { ref } from 'vue'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/init.js'

const email = ref('')
const password = ref('')
const message = ref('')
const errorMessage = ref('')

const register = async () => {
  message.value = ''
  errorMessage.value = ''

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    )

    console.log('Firebase Register Successful!')
    console.log('Registered user:', userCredential.user)

    message.value = 'Registration successful!'
  } catch (error) {
    console.error('Registration error:', error.code)
    errorMessage.value = error.code
  }
}
</script>

<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h1 class="text-center mb-4">Create an Account</h1>

        <form @submit.prevent="register">
          <div class="mb-3">
            <label for="register-email" class="form-label">Email</label>
            <input
              id="register-email"
              v-model="email"
              type="email"
              class="form-control"
              placeholder="Email"
              required
            />
          </div>

          <div class="mb-3">
            <label for="register-password" class="form-label">Password</label>
            <input
              id="register-password"
              v-model="password"
              type="password"
              class="form-control"
              placeholder="Password"
              minlength="6"
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
            Register with Firebase
          </button>
        </form>
      </div>
    </div>
  </div>
</template>