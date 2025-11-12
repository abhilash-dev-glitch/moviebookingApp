import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE || '/api/v1'

export const api = axios.create({
  baseURL,
  withCredentials: true,
})

// Prevent cached 304 responses (especially for /auth/me) by disabling cache on GETs
api.interceptors.request.use((config) => {
  if ((config.method || 'get').toLowerCase() === 'get') {
    const params = new URLSearchParams(config.params || {})
    params.set('_ts', Date.now().toString())
    config.params = Object.fromEntries(params)
    config.headers = {
      ...config.headers,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    }
  }
  return config
})

export const MoviesAPI = {
  list: (params) => api.get('/movies', { params }).then(r => r.data.data.movies),
  get: (id) => api.get(`/movies/${id}`).then(r => r.data.data.movie),
  showtimes: (id) => api.get(`/movies/${id}/showtimes`).then(r => r.data.data.showtimes)
}

export const ShowtimesAPI = {
  get: (id) => api.get(`/showtimes/${id}`).then(r => r.data.data.showtime),
  list: (params) => api.get('/showtimes', { params }).then(r => r.data.data.showtimes)
}

export const BookingAPI = {
  lockedSeats: (showtimeId) => api.get(`/bookings/showtime/${showtimeId}/locked-seats`).then(r => r.data.data),
  checkSeats: (payload) => api.post('/bookings/check-seats', payload).then(r => r.data.data),
  create: (payload) => api.post('/bookings', payload).then(r => r.data.data.booking),
  myBookings: () => api.get('/bookings/my-bookings').then(r => r.data.data.bookings),
}

export const PaymentAPI = {
  gateways: () => api.get('/payments/gateways').then(r => r.data.data),
  create: (payload) => api.post('/payments/create', payload).then(r => r.data.data),
  verify: (payload) => api.post('/payments/verify', payload).then(r => r.data.data),
}

export const ReviewsAPI = {
  list: (movieId) => api.get(`/movies/${movieId}/reviews`).then(r => r.data.data.reviews),
  create: (movieId, payload) => api.post(`/movies/${movieId}/reviews`, payload).then(r => r.data.data.review),
  update: (reviewId, payload) => api.patch(`/reviews/${reviewId}`, payload).then(r => r.data.data.review),
  remove: (reviewId) => api.delete(`/reviews/${reviewId}`).then(() => true),
}

export const UsersAPI = {
  uploadProfilePicture: async (file) => {
    const form = new FormData()
    form.append('profilePicture', file)
    const { data } = await api.post('/users/profile-picture', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data?.data
  },
  updateMe: (payload) => api.patch('/users/me', payload).then(r => r.data.data.user),
  me: () => api.get('/auth/me').then(r => r.data.data.user),
}
