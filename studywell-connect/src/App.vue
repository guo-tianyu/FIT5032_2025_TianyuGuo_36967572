<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const isOnline = ref(navigator.onLine)

const updateNetworkStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateNetworkStatus)
  window.addEventListener('offline', updateNetworkStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateNetworkStatus)
  window.removeEventListener('offline', updateNetworkStatus)
})
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div class="app-shell">
    <AppHeader />
    <p v-if="!isOnline" class="network-status" role="status" aria-live="polite">
      You are offline. Some features may be temporarily unavailable.
    </p>
    <main id="main-content">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>
