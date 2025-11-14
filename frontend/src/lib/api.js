import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE || '/api/v1'

export const api = axios.create({
  baseURL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
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

api.interceptors.response.use(
  (response) => {
    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
    }
    return Promise.reject(error)
  }
)

export const MoviesAPI = {
  list: async (params) => {
    try {
      const response = await api.get('/movies', { params });
      
      if (response.data?.data?.movies) {
        return response.data.data.movies;
      } else if (response.data?.data) {
        return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data) {
        return [response.data];
      }
      return [];
    } catch (error) {
      console.error('Error fetching movies:', error);
      return [];
    }
  },
  get: async (id) => {
    const response = await api.get(`/movies/${id}`);
    return response.data?.data?.movie || response.data;
  },
  showtimes: async (id) => {
    const response = await api.get(`/movies/${id}/showtimes`);
    return response.data?.data?.showtimes || [];
  }
}

export const ShowtimesAPI = {
  get: async (id) => {
    const response = await api.get(`/showtimes/${id}`);
    return response.data?.data?.showtime || response.data;
  },
  list: async (params) => {
    const response = await api.get('/showtimes', { params });
    if (response.data?.data?.showtimes) {
      return response.data.data.showtimes;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data) {
      return response.data.data;
    }
    return [];
  }
}

export const BookingAPI = {
  lockedSeats: (showtimeId) => api.get(`/bookings/showtime/${showtimeId}/locked-seats`).then(r => r.data.data),
  lockSeat: (showtimeId, seatData) => api.post(`/bookings/lock-seat`, { showtimeId, ...seatData }).then(r => r.data.data),
  unlockSeat: (showtimeId, seatData) => api.post(`/bookings/unlock-seat`, { showtimeId, ...seatData }).then(r => r.data.data),
  checkSeats: (payload) => api.post('/bookings/check-seats', payload).then(r => r.data.data),
  create: (payload) => api.post('/bookings', payload).then(r => r.data.data.booking),
  get: (id) => api.get(`/bookings/${id}`).then(r => r.data.data.booking),
  myBookings: () => api.get('/bookings/my-bookings').then(r => r.data.data.bookings),
  cancelBooking: (id) => api.delete(`/bookings/${id}`).then(r => r.data.data.booking),
}

export const TheatersAPI = {
  list: async (params = {}) => {
    const response = await api.get('/theaters', { params });
    if (response.data?.data?.theaters) {
      return response.data.data.theaters;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data) {
      return response.data.data;
    }
    return [];
  },
  get: async (id) => {
    const response = await api.get(`/theaters/${id}`);
    return response.data?.data?.theater || response.data;
  }
};

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
