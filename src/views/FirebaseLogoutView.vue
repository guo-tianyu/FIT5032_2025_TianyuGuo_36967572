<script setup>
import { ref } from 'vue'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const message = ref('')
const errorMessage = ref('')

const logout = async () => {
  message.value = ''
  errorMessage.value = ''

  try {
    await signOut(auth)

    console.log('Firebase Logout Successful!')
    console.log('Current user after logout:', auth.currentUser)

    message.value = 'Logout successful! Current user is null.'
  } catch (error) {
    console.error('Firebase logout error:', error.code)
    errorMessage.value = error.code
  }
}
</script>

<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6 text-center">
        <h1 class="mb-4">Firebase Logout</h1>

        <div v-if="message" class="alert alert-success">
          {{ message }}
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>

        <button
          type="button"
          class="btn btn-danger w-100"
          @click="logout"
        >
          Logout from Firebase
        </button>
      </div>
    </div>
  </div>
</template>