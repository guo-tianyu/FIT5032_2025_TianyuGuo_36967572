<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../auth'

const username = ref('')
const password = ref('')
const errorMessage = ref('')

const route = useRoute()
const router = useRouter()

const submitLogin = () => {
  if (login(username.value, password.value)) {
    const destination = typeof route.query.redirect === 'string' ? route.query.redirect : '/about'
    router.push(destination)
  } else {
    errorMessage.value = 'Invalid username or password.'
  }
}
</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div v-if="$route.name === 'AccessDenied'" class="alert alert-danger" role="alert">
          Access denied. Please log in to view the About page.
        </div>

        <h1 class="text-center">Library Login</h1>
        <form @submit.prevent="submitLogin">
          <div class="mb-3">
            <label for="login-username" class="form-label">Username</label>
            <input
              id="login-username"
              v-model="username"
              type="text"
              class="form-control"
              autocomplete="username"
            />
          </div>

          <div class="mb-3">
            <label for="login-password" class="form-label">Password</label>
            <input
              id="login-password"
              v-model="password"
              type="password"
              class="form-control"
              autocomplete="current-password"
            />
          </div>

          <div v-if="errorMessage" class="text-danger mb-3">{{ errorMessage }}</div>
          <p class="text-muted small">Demo account: admin / Password1!</p>

          <div class="text-center">
            <button type="submit" class="btn btn-primary">Login</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
