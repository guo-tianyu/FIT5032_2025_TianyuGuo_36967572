import { ref } from 'vue'

// Activity 6.1: simple hardcoded authentication state for conditional routing.
export const isAuthenticated = ref(false)

export const login = (username, password) => {
  const isValid = username === 'admin' && password === 'Password1!'
  isAuthenticated.value = isValid
  return isValid
}

export const logout = () => {
  isAuthenticated.value = false
}
