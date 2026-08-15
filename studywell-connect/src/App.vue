<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()
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

watch(() => route.fullPath, async () => {
  await nextTick()
  document.querySelector('#main-content')?.focus()
})
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div class="app-shell">
    <AppHeader />
    <p v-if="!isOnline" class="network-status" role="status" aria-live="polite">
      You are offline. Some features may be temporarily unavailable.
    </p>
    <main id="main-content" tabindex="-1">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>
