import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import { isAuthenticated } from '../auth'
import FirebaseRegisterView from '../views/FirebaseRegisterView.vue'
import FirebaseSigninView from '../views/FirebaseSigninView.vue'
import FirebaseLogoutView from '../views/FirebaseLogoutView.vue'
import AddBookView from '../views/AddBookView.vue'
import Lab9View from '../views/Lab9View.vue'
import WeatherView from '../views/WeatherView.vue'
import CountBookAPI from '../views/CountBookAPI.vue'
import GetAllBookAPI from '../views/GetAllBookAPI.vue'

const routes = [
  {
    path: '/WeatherCheck',
    name: 'WeatherCheck',
    component: WeatherView
  },
  {
    path: '/CountBookAPI',
    name: 'CountBookAPI',
    component: CountBookAPI
  },
  {
    path: '/GetAllBookAPI',
    name: 'GetAllBookAPI',
    component: GetAllBookAPI
  },
  {
    path: '/lab9',
    name: 'Lab9',
    component: Lab9View
  },
  {
    path: '/addbook',
    name: 'AddBook',
    component: AddBookView
  },
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
