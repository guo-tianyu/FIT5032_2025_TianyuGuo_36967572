import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import { isAuthenticated } from '../auth'
import FirebaseRegisterView from '../views/FirebaseRegisterView.vue'
import FirebaseSigninView from '../views/FirebaseSigninView.vue'
import FirebaseLogoutView from '../views/FirebaseLogoutView.vue'

const routes = [
  {
  path: '/FireLogout',
  name: 'FireLogout',
  component: FirebaseLogoutView
  },
  {
  path: '/FireLogin',
  name: 'FireLogin',
  component: FirebaseSigninView
  },
  {
  path: '/FireRegister',
  name: 'FirebaseRegister',
  component: FirebaseRegisterView
  },
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: LoginView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return {
      name: 'AccessDenied',
      query: { redirect: to.fullPath }
    }
  }

  if ((to.name === 'Login' || to.name === 'AccessDenied') && isAuthenticated.value) {
    return { name: 'About' }
  }
})

export default router
