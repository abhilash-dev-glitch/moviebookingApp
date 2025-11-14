import { useEffect, useState, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FiUsers,
  FiFilm,
  FiCalendar,
  FiDollarSign,
  FiHome,
  FiLoader,
  FiAlertCircle,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { adminService } from '/src/services/adminService.js';
import { toast } from '/src/lib/toast.js';

// Format number with commas
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

// Format currency (Set to INR as requested by your location)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
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
    totalTheaters: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const ws = useRef(null);

  // Stats data array - will now be populated from state
  const statsData = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: <FiDollarSign className="text-purple-500" size={24} />,
    },
    {
      title: 'Total Bookings',
      value: formatNumber(stats.totalBookings),
      icon: <FiCalendar className="text-yellow-500" size={24} />,
    },
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      icon: <FiUsers className="text-blue-500" size={24} />,
    },
    {
      title: 'Total Movies',
      value: formatNumber(stats.totalMovies),
      icon: <FiFilm className="text-green-500" size={24} />,
    },
    {
      title: 'Total Theaters',
      value: formatNumber(stats.totalTheaters),
      icon: <FiHome className="text-red-500" size={24} />,
    },
  ];

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      // Set loading only if it's not already true
      if (!loading) setLoading(true); 
      
      const data = await adminService.getDashboardStats();

      // Calculate net revenue (total revenue - cancelled bookings)
      const cancelledRevenue = data.cancelledRevenue || 0;
      const netRevenue = (data.totalRevenue || 0) - cancelledRevenue;

      setStats({
        totalUsers: data.totalUsers,
        totalMovies: data.totalMovies,
        totalTheaters: data.totalTheaters,
        totalBookings: data.totalBookings,
        totalRevenue: netRevenue, // Net revenue after subtracting cancellations
      });

      setRecentBookings(data.recentBookings);

      // Format chart data for recharts
      const formattedData = (data.revenueChartData || []).map((item) => ({
        date: format(new Date(item.date), 'MM/dd'), // Format date as '11/12'
        revenue: item.revenue,
      }));
      setRevenueData(formattedData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
      toast.error('Error', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(); // Initial data fetch

    // --- WebSocket Connection ---
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//localhost:3000`; // Connect to backend port
    console.log(`Connecting to WebSocket at: ${wsUrl}`);

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);

        // Handle realtime updates
        if (message.type === 'NEW_USER') {
          toast.info('New User Registered!', `Welcome, ${message.payload.name}`);
          setStats((prevStats) => ({
            ...prevStats,
            totalUsers: prevStats.totalUsers + 1,
          }));
        }

        if (message.type === 'NEW_BOOKING') {
          const newBooking = message.payload;
          toast.info('New Booking!', `A new booking of ${formatCurrency(newBooking.totalAmount)} was made.`);
          setStats((prevStats) => ({
            ...prevStats,
            totalBookings: prevStats.totalBookings + 1,
            totalRevenue: prevStats.totalRevenue + newBooking.totalAmount,
          }));
          // Add to recent bookings and update chart
          setRecentBookings(prev => [newBooking, ...prev.slice(0, 4)]);
          // Re-fetch chart data to include new booking
          adminService.getDashboardStats().then(data => {
             const formattedData = (data.revenueChartData || []).map((item) => ({
                date: format(new Date(item.date), 'MM/dd'),
                revenue: item.revenue,
              }));
              setRevenueData(formattedData);
          });
        }

        if (message.type === 'BOOKING_CANCELLED') {
          const cancelledBooking = message.payload;
          toast.warning('Booking Cancelled', `A booking of ${formatCurrency(cancelledBooking.totalAmount)} was cancelled.`);
          setStats((prevStats) => ({
            ...prevStats,
            totalRevenue: prevStats.totalRevenue - cancelledBooking.totalAmount,
          }));
          // Re-fetch data to update everything
          fetchDashboardData();
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup function
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-indigo-600 text-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <FiAlertCircle className="mx-auto text-4xl mb-2" />
          <h2 className="text-lg font-semibold">Error Loading Dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 flex items-center"
          >
            <div className="p-3 rounded-lg bg-indigo-50 mr-4">
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.title}</p>
              <div className="flex items-center">
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Revenue Overview (Last 7 Days)
            </h3>
            <select 
              disabled 
              className="text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100 text-gray-500"
            >
              <option>Last 7 days</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{ top: 5, right: 0, left: 20, bottom: 5 }} // Added left margin for Y-axis labels
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.375rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FiAlertCircle className="text-2xl mb-2" />
                <p>No revenue data available for the last 7 days</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Bookings
            </h2>
          </div>
          <div className="overflow-y-auto h-[350px]">
            {recentBookings.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map((booking) => (
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
                              {booking.showtime?.movie?.title || 'Movie'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatCurrency(booking.totalAmount || 0)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(booking.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FiCalendar className="text-4xl mb-2 text-gray-300" />
                <p>No recent bookings found</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <Link
              to="/admin/bookings"
              className="w-full text-center block px-4 py-2 border rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
            >
              View All Bookings
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}