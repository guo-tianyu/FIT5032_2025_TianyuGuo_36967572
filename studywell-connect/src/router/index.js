import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ResourcesView from '@/views/ResourcesView.vue'
import SupportView from '@/views/SupportView.vue'
import WorkshopsView from '@/views/WorkshopsView.vue'
import AuthView from '@/views/AuthView.vue'
import StudentDashboardView from '@/views/StudentDashboardView.vue'
import StaffDashboardView from '@/views/StaffDashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/resources', name: 'resources', component: ResourcesView },
    { path: '/support', name: 'support', component: SupportView },
    { path: '/workshops', name: 'workshops', component: WorkshopsView },
    { path: '/auth', name: 'auth', component: AuthView },
    { path: '/student', name: 'student-dashboard', component: StudentDashboardView, meta: { requiresAuth: true, role: 'student' } },
    { path: '/staff', name: 'staff-dashboard', component: StaffDashboardView, meta: { requiresAuth: true, role: 'staff' } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

export default router
