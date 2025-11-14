import { api } from '../lib/api';

export const adminService = {
  // --- DASHBOARD ---
  getDashboardStats: async () => {
    try {
      const { data } = await api.get('/dashboard/admin-stats');
      return data.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // --- MOVIES ---
  getMovies: async (params = {}) => {
    try {
      const response = await api.get('/movies', { params });
      return response.data; // Assumes API returns { status, results, data: { movies } }
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  },
  
  createMovie: async (movieData) => {
    try {
      const response = await api.post('/movies', movieData);
      return response.data; // Assumes API returns { status, data: { movie } }
    } catch (error) {
      console.error('Error creating movie:', error);
      throw error;
    }
  },

  updateMovie: async (id, movieData) => {
    try {
      const response = await api.patch(`/movies/${id}`, movieData);
      return response.data; // Assumes API returns { status, data: { movie } }
    } catch (error) {
      console.error('Error updating movie:', error);
      throw error;
    }
  },

  deleteMovie: async (id) => {
    try {
      const response = await api.delete(`/movies/${id}`);
      return response.data; // Assumes API returns 204 no content
    } catch (error) {
      console.error('Error deleting movie:', error);
      throw error;
    }
  },

  uploadPoster: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('poster', file);
      const response = await api.post(`/movies/${id}/poster`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data; // Assumes API returns { status, data: { poster, ... } }
    } catch (error) {
      console.error('Error uploading poster:', error);
      throw error;
    }
  },

  // --- THEATERS ---
  getTheaters: async (params = {}) => {
    try {
      const response = await api.get('/theaters', { params });
      return response.data; // Assumes API returns { status, results, data: { theaters } }
    } catch (error) {
      console.error('Error fetching theaters:', error);
      throw error;
    }
  },

  createTheater: async (theaterData) => {
    try {
      const response = await api.post('/theaters', theaterData);
      return response.data; // Assumes API returns { status, data: { theater } }
    } catch (error) {
      console.error('Error creating theater:', error);
      throw error;
    }
  },

  updateTheater: async (id, theaterData) => {
    try {
      const response = await api.patch(`/theaters/${id}`, theaterData);
      return response.data; // Assumes API returns { status, data: { theater } }
    } catch (error) {
      console.error('Error updating theater:', error);
      throw error;
    }
  },

  deleteTheater: async (id) => {
    try {
      const response = await api.delete(`/theaters/${id}`);
      return response.data; // Assumes API returns 204 no content
    } catch (error) {
      console.error('Error deleting theater:', error);
      throw error;
    }
  },

  // --- SHOWTIMES ---
  getShowtimes: async (params = {}) => {
    try {
      const response = await api.get('/showtimes', { params });
      return response.data; // Assumes API returns { status, results, data: { showtimes } }
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      throw error;
    }
  },

  createShowtime: async (showtimeData) => {
    try {
      const response = await api.post('/showtimes', showtimeData);
      return response.data;
    } catch (error) {
      console.error('Error creating showtime:', error);
      throw error;
    }
  },

  updateShowtime: async (id, showtimeData) => {
    try {
      const response = await api.patch(`/showtimes/${id}`, showtimeData);
      return response.data;
    } catch (error) {
      console.error('Error updating showtime:', error);
      throw error;
    }
  },

  deleteShowtime: async (id) => {
    try {
      const response = await api.delete(`/showtimes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting showtime:', error);
      throw error;
    }
  },

  // --- USERS & MANAGERS ---
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/users', { params });
      return response.data; // Assumes API returns { status, results, data: { users } }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getTheaterManagers: async () => {
    try {
      const response = await api.get('/users/theater-managers');
      return response.data; // Assumes API returns { status, results, data: { theaterManagers } }
    } catch (error) {
      console.error('Error fetching theater managers:', error);
      throw error;
    }
  },
  
  createManager: async (managerData) => {
    try {
      const response = await api.post('/users/theater-manager', managerData);
      return response.data;
    } catch (error) {
      console.error('Error creating manager:', error);
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      // This is a generic update. Your backend has specific routes for role, etc.
      // We'll use the activate/deactivate routes as needed.
      if (userData.hasOwnProperty('isActive')) {
        const route = userData.isActive ? 'activate' : 'deactivate';
        const response = await api.patch(`/users/${id}/${route}`);
        return response.data;
      }
      // For other updates like name, phone (based on your controller)
      const response = await api.patch(`/users/${id}`, userData); 
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  
  assignTheatersToManager: async (id, theaterIds) => {
    try {
      const response = await api.patch(`/users/${id}/assign-theaters`, { theaterIds });
      return response.data;
    } catch (error) {
      console.error('Error assigning theaters:', error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      // Note: Your backend doesn't have a direct delete user route,
      // it uses deactivate. This function is here for completeness
      // but you should use the updateUser({ isActive: false }) instead.
      const response = await api.patch(`/users/${id}/deactivate`); 
      return response.data;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  },

  // --- BOOKINGS ---
  getBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }
};