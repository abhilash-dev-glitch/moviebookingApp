import { api } from './api';

export const AdminAPI = {
  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      const [usersRes, moviesRes, bookingsRes, revenueRes] = await Promise.all([
        api.get('/users'),
        api.get('/movies'),
        api.get('/bookings'),
        api.get('/bookings/revenue')
      ]);
      
      return {
        totalUsers: usersRes.data.total || 0,
        totalMovies: moviesRes.data.total || 0,
        totalBookings: bookingsRes.data.total || 0,
        totalRevenue: revenueRes.data.totalRevenue || 0,
        recentBookings: bookingsRes.data.bookings?.slice(0, 5) || []
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Users
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Movies
  getMovies: async (params = {}) => {
    try {
      const response = await api.get('/movies', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  },

  // Bookings
  getBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Revenue
  getRevenue: async (params = {}) => {
    try {
      const response = await api.get('/bookings/revenue', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  },

  // Recent Activity (combines recent users and bookings)
  getRecentActivity: async () => {
    try {
      const [usersRes, bookingsRes] = await Promise.all([
        api.get('/users', { params: { limit: 5, sort: '-createdAt' } }),
        api.get('/bookings', { params: { limit: 5, sort: '-createdAt' } })
      ]);

      const activities = [];
      
      // Add user signups
      usersRes.data.users?.forEach(user => {
        activities.push({
          type: 'user',
          id: user._id,
          name: user.name,
          action: 'signed up',
          timestamp: user.createdAt,
          icon: 'user'
        });
      });

      // Add bookings
      bookingsRes.data.bookings?.forEach(booking => {
        activities.push({
          type: 'booking',
          id: booking._id,
          name: booking.user?.name || 'A user',
          action: 'made a booking',
          timestamp: booking.createdAt,
          icon: 'ticket'
        });
      });

      // Sort by timestamp and return top 5
      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }
};

export default AdminAPI;
