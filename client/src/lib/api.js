import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('neare.token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = String(error.config?.url || '')
    const authAttempt = url.includes('/auth/login') || url.includes('/auth/register')
    if (status === 401 && !authAttempt) {
      localStorage.removeItem('neare.token')
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login')
    }
    const message = error.response?.data?.message || 'Network error. Check your connection and try again.'
    const wrapped = new Error(message)
    wrapped.code = error.response?.data?.code
    wrapped.status = status
    wrapped.details = error.response?.data?.data
    return Promise.reject(wrapped)
  }
)

export default api
