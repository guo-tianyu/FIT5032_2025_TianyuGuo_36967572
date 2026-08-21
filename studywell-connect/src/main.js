import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'leaflet/dist/leaflet.css'
import './assets/main.css'
import '@/services/firebase'
import App from './App.vue'
import router from './router'
import { initialiseAuth } from './services/auth'
import { registerOfflineWorker } from './services/offline'

async function startApplication() {
  await initialiseAuth()
  createApp(App).use(router).mount('#app')
  registerOfflineWorker()
}

startApplication()
