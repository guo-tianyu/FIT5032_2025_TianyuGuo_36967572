<script setup>
import { useRouter } from 'vue-router'
import { authState, logout } from '@/services/auth'

const router = useRouter()

async function signOut() {
  await router.push('/')
  logout()
}
</script>

<template>
  <header class="site-header">
    <div class="utility-bar">
      <div class="container d-flex justify-content-between align-items-center">
        <span>Free, confidential guidance for international students</span>
        <span><strong>Need urgent help?</strong> Call 000</span>
      </div>
    </div>
    <nav class="navbar navbar-expand-lg" aria-label="Main navigation">
      <div class="container py-2">
        <RouterLink class="navbar-brand d-flex align-items-center gap-2" to="/" aria-label="StudyWell Connect home">
          <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="brand-words"><strong>StudyWell</strong><small>Connect</small></span>
        </RouterLink>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavigation" aria-controls="mainNavigation" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="mainNavigation" class="collapse navbar-collapse">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li class="nav-item"><RouterLink class="nav-link" to="/">Home</RouterLink></li>
            <li class="nav-item"><RouterLink class="nav-link" to="/resources">Resources</RouterLink></li>
            <li class="nav-item"><RouterLink class="nav-link" to="/support">Support</RouterLink></li>
            <li class="nav-item"><RouterLink class="nav-link" to="/workshops">Workshops</RouterLink></li>
            <li v-if="authState.currentUser" class="nav-item"><RouterLink class="nav-link" :to="authState.currentUser.role === 'staff' ? '/staff' : '/student'">My dashboard</RouterLink></li>
            <li v-if="!authState.currentUser" class="nav-item ms-lg-2 mt-2 mt-lg-0"><RouterLink class="btn btn-brand" to="/auth">Sign in</RouterLink></li>
            <li v-else class="nav-item ms-lg-2 mt-2 mt-lg-0"><button class="btn btn-outline-brand" type="button" @click="signOut">Sign out</button></li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>
