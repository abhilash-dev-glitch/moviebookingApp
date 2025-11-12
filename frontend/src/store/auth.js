import { create } from 'zustand'
import { api } from '../lib/api'

export const useAuth = create((set, get) => ({
  user: null,
  loading: false,
  error: null,
  errors: null,

  init: async () => {
    try {
      set({ loading: true })
      const { data } = await api.get('/auth/me')
      const user = data?.data?.user
      set({ user: user || null, loading: false })
    } catch (e) {
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null, errors: null })
    try {
      await api.post('/auth/login', { email, password })
      const { data } = await api.get('/auth/me')
      const user = data?.data?.user
      set({ user: user || null, loading: false })
      return user || null
    } catch (e) {
      set({ error: e.response?.data?.message || 'Login failed', errors: e.response?.data?.errors || null, loading: false })
      return null
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null, errors: null })
    try {
      await api.post('/auth/register', payload)
      const { data } = await api.get('/auth/me')
      const user = data?.data?.user
      set({ user: user || null, loading: false })
      return user || null
    } catch (e) {
      set({ error: e.response?.data?.message || 'Registration failed', errors: e.response?.data?.errors || null, loading: false })
      return null
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch {}
    set({ user: null })
  }
}))
