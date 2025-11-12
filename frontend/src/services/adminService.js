import { api } from '../lib/api';

export const adminService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      // Get users count
      const usersRes = await api.get('/users?limit=1');
      
      // Get movies count
      const moviesRes = await api.get('/movies?limit=1');
      
      // Get bookings count and revenue (fallback to 0 if the endpoint fails)
      let statsData = {
        totalBookings: 0,
        totalRevenue: 0,
        recentBookings: [],
        dailyRevenue: {}
      };
      
      try {
        const statsRes = await api.get('/api/v1/bookings/stats/revenue');
        if (statsRes.data && statsRes.data.data) {
          const { data } = statsRes.data;
          statsData = {
            totalBookings: data.totalBookings || 0,
            totalRevenue: data.totalRevenue || 0,
            recentBookings: data.recentBookings || [],
            dailyRevenue: data.dailyRevenue || {}
          };
        }
      } catch (error) {
        console.warn('Could not fetch booking stats, using default values', error);
      }

      return {
        totalUsers: usersRes.data?.total || 0,
        totalMovies: moviesRes.data?.total || 0,
        totalBookings: statsData.totalBookings,
        totalRevenue: statsData.totalRevenue,
        recentBookings: statsData.recentBookings,
        revenueData: Object.entries(statsData.dailyRevenue).map(([date, revenue]) => ({
          date,
          revenue: revenue || 0
        }))
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get all users
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        // Handle unauthorized (likely session expired)
        window.location.href = '/login';
      }
      throw error;
    }
  },

  // Get all movies
  getMovies: async (params = {}) => {
    try {
      const response = await api.get('/movies', params);
      return response.data;
    } catch (error) {
      console.error('Error fetching movies:', error);
      if (error.response?.status === 401) {
        // Handle unauthorized (likely session expired)
        window.location.href = '/login';
      }
      throw error;
    }
  },

  // Get all bookings
  getBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings', { 
        params: {
          ...params,
          populate: 'user,showtime.movie,showtime.theater'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }
};

export default adminService;
