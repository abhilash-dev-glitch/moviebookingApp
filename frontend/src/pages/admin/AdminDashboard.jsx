import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiUsers, FiFilm, FiCalendar, FiDollarSign, FiMenu, FiLoader, FiAlertCircle, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import { adminService } from '../../services/adminService';

// Format number with commas
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM dd, yyyy');
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMovies: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [moviesError, setMoviesError] = useState(null);

  // Fetch movies
  const fetchMovies = async () => {
    try {
      setMoviesLoading(true);
      const response = await adminService.getMovies();
      setMovies(response.data.movies || []);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setMoviesError('Failed to load movies. Please try again later.');
    } finally {
      setMoviesLoading(false);
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data using the admin service
        const dashboardData = await adminService.getDashboardStats();
        
        // Update state with the fetched data
        setStats({
          totalUsers: dashboardData.totalUsers,
          totalMovies: dashboardData.totalMovies,
          totalBookings: dashboardData.totalBookings,
          totalRevenue: dashboardData.totalRevenue,
        });
        
        // Process recent bookings
        setRecentBookings(dashboardData.recentBookings);
        
        // Process revenue data for chart
        const formattedData = dashboardData.revenueData.map(item => ({
          date: format(new Date(item.date), 'MM dd'),
          revenue: item.revenue
        }));
        
        // Ensure we have data for the last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i);
          return {
            date: format(date, 'MM dd'),
            revenue: 0
          };
        });
        
        // Merge with actual data
        const mergedData = last7Days.map(day => {
          const found = formattedData.find(d => d.date === day.date);
          return found || day;
        });
        
        setRevenueData(mergedData);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchMovies();
  }, []);

  // Stats data with real values
  const statsData = [
    { 
      title: 'Total Users', 
      value: formatNumber(stats.totalUsers), 
      change: '+0%', 
      trend: 'up', 
      icon: <FiUsers className="text-blue-500" size={24} /> 
    },
    { 
      title: 'Total Movies', 
      value: formatNumber(stats.totalMovies), 
      change: '+0%', 
      trend: 'up', 
      icon: <FiFilm className="text-green-500" size={24} /> 
    },
    { 
      title: 'Total Bookings', 
      value: formatNumber(stats.totalBookings), 
      change: '+0%', 
      trend: 'up', 
      icon: <FiCalendar className="text-yellow-500" size={24} /> 
    },
    { 
      title: 'Total Revenue', 
      value: formatCurrency(stats.totalRevenue), 
      change: '+0%', 
      trend: 'up', 
      icon: <FiDollarSign className="text-purple-500" size={24} /> 
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-indigo-800 text-white transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-indigo-700"
          >
            <FiMenu size={24} />
          </button>
        </div>
        <nav className="mt-6">
          <NavItem icon={<FiUsers />} text="Dashboard" active={true} isSidebarOpen={isSidebarOpen} />
          <NavItem icon={<FiFilm />} text="Movies" isSidebarOpen={isSidebarOpen} />
          <NavItem icon={<FiCalendar />} text="Showtimes" isSidebarOpen={isSidebarOpen} />
          <NavItem icon={<FiUsers />} text="Users" isSidebarOpen={isSidebarOpen} />
          <NavItem icon={<FiDollarSign />} text="Revenue" isSidebarOpen={isSidebarOpen} />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 flex items-center">
                <div className="p-3 rounded-lg bg-indigo-50 mr-4">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <div className="flex items-center">
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <span className={`ml-2 text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Revenue Overview</h3>
                <select 
                  className="text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                >
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>This year</option>
                </select>
              </div>
              <div className="h-[400px] w-full">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FiLoader className="animate-spin text-2xl mb-2" />
                    <p>Loading revenue data...</p>
                  </div>
                ) : revenueData.length > 0 ? (
                  <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={revenueData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6B7280' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6B7280' }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '0.375rem',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [formatCurrency(value), 'Revenue']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="#6366F1" 
                          radius={[4, 4, 0, 0]} 
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FiAlertCircle className="text-2xl mb-2" />
                    <p>No revenue data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <div key={booking._id} className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                        {booking.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.user?.name || 'Guest User'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {booking.showtime?.movie?.title || 'Movie'}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(booking.totalAmount || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.createdAt ? formatDate(booking.createdAt) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <FiCalendar className="text-2xl mb-2" />
                    <p>No recent bookings found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Recent Bookings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movie</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentBookings.length > 0 ? (
                      recentBookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                                {booking.user?.name?.charAt(0) || 'U'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.user?.name || 'Guest User'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.user?.email || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.showtime?.movie?.title || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.showtime?.theater?.name || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.showtime?.date ? formatDate(booking.showtime.date) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.showtime?.time || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(booking.totalAmount || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                booking.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : booking.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          No bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <button className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  View All
                </button>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 border rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Movies Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Movies</h2>
              <button 
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={() => {}}
              >
                <FiPlus className="mr-2" />
                Add Movie
              </button>
            </div>
            
            {moviesLoading ? (
              <div className="flex justify-center items-center py-12">
                <FiLoader className="animate-spin text-indigo-600 text-2xl mr-2" />
                <span>Loading movies...</span>
              </div>
            ) : moviesError ? (
              <div className="text-red-500 text-center py-6">{moviesError}</div>
            ) : movies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiFilm className="mx-auto text-4xl mb-2 text-gray-300" />
                <p>No movies found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poster
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Release Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movies.map((movie) => (
                      <tr key={movie._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {movie.poster ? (
                            <img 
                              src={movie.poster} 
                              alt={movie.title}
                              className="h-16 w-12 object-cover rounded"
                            />
                          ) : (
                            <div className="h-16 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                              <FiFilm />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{movie.title}</div>
                          <div className="text-sm text-gray-500">{movie.genre?.join(', ')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movie.duration} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movie.releaseDate ? formatDate(movie.releaseDate) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            movie.status === 'now showing' 
                              ? 'bg-green-100 text-green-800' 
                              : movie.status === 'coming soon'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {movie.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                            <FiEdit2 className="inline mr-1" /> Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <FiTrash2 className="inline mr-1" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Reusable Nav Item Component
function NavItem({ icon, text, active = false, isSidebarOpen }) {
  return (
    <div
      className={`flex items-center px-6 py-3 ${
        active ? 'bg-indigo-700' : 'hover:bg-indigo-700'
      } transition-colors duration-200 cursor-pointer`}
    >
      <div className="flex-shrink-0">{icon}</div>
      {isSidebarOpen && <span className="ml-3">{text}</span>}
    </div>
  );
}
