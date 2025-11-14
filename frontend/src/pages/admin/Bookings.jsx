import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from '../../lib/toast';
import {
  FiCalendar,
  FiUser,
  FiFilm,
  FiHome,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiLoader,
  FiAlertCircle,
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import { format } from 'date-fns';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, paid, cancelled, pending
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    cancelled: 0,
    pending: 0,
    totalRevenue: 0,
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching bookings...');
      const response = await adminService.getBookings();
      console.log('Bookings response:', response);
      
      const bookingsData = response.data?.bookings || [];
      console.log('Bookings data:', bookingsData);
      setBookings(bookingsData);
      
      // Calculate stats
      const stats = {
        total: bookingsData.length,
        paid: bookingsData.filter(b => b.paymentStatus === 'paid').length,
        cancelled: bookingsData.filter(b => b.paymentStatus === 'cancelled').length,
        pending: bookingsData.filter(b => b.paymentStatus === 'pending').length,
        totalRevenue: bookingsData
          .filter(b => b.paymentStatus === 'paid')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      };
      console.log('Calculated stats:', stats);
      setStats(stats);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load bookings');
      toast.error('Failed to load bookings', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.paymentStatus === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      paid: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-800/50', icon: FiCheckCircle },
      cancelled: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-800/50', icon: FiXCircle },
      pending: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-800/50', icon: FiClock },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <FiLoader className="animate-spin text-brand text-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
        <FiAlertCircle className="text-4xl mb-2" />
        <p>{error}</p>
        <button
          onClick={fetchBookings}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-red-900">
          All Bookings
        </h1>
        <p className="text-sm text-red-600 mt-1">
          Manage and view all booking details
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 backdrop-blur-sm rounded-xl border border-blue-700/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200 font-semibold">Total Bookings</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <FiCalendar className="text-blue-400 text-2xl" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 backdrop-blur-sm rounded-xl border border-green-700/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-200 font-semibold">Paid</p>
              <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
            </div>
            <FiCheckCircle className="text-green-400 text-2xl" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 backdrop-blur-sm rounded-xl border border-red-700/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-200 font-semibold">Cancelled</p>
              <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
            </div>
            <FiXCircle className="text-red-400 text-2xl" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 backdrop-blur-sm rounded-xl border border-yellow-700/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-200 font-semibold">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <FiClock className="text-yellow-400 text-2xl" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-brand/20 to-brand/10 backdrop-blur-sm rounded-xl border border-brand/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-200 font-semibold">Total Revenue</p>
              <p className="text-2xl font-bold text-brand">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <TbCurrencyRupee className="text-brand text-2xl" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'paid', 'cancelled', 'pending'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              filter === status
                ? 'bg-brand text-white shadow-lg shadow-brand/30 scale-105'
                : 'bg-gray-800/80 text-white border border-gray-600/50 hover:bg-gray-700/80 hover:border-brand/50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && ` (${stats[status]})`}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/30 border-2 border-dashed border-gray-700 rounded-lg">
          <FiCalendar className="mx-auto text-5xl text-gray-500 mb-3" />
          <h3 className="text-xl font-semibold text-white">No Bookings Found</h3>
          <p className="text-gray-400 mt-1">
            {filter === 'all' ? 'No bookings have been made yet.' : `No ${filter} bookings found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:border-brand/60 hover:shadow-lg hover:shadow-brand/20 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row">
                {/* Movie Poster */}
                {booking.showtime?.movie?.poster && (
                  <div className="flex-shrink-0 w-full md:w-32 h-48 md:h-auto">
                    <img
                      src={booking.showtime.movie.poster}
                      alt={booking.showtime.movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Booking Details */}
                <div className="flex-1 p-5 bg-black/20">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Movie & Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FiFilm className="text-brand" />
                            {booking.showtime?.movie?.title || 'N/A'}
                          </h3>
                          <p className="text-sm text-gray-300 mt-1 font-mono">
                            ID: {booking._id}
                          </p>
                        </div>
                        {getStatusBadge(booking.paymentStatus)}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center text-sm bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                        <FiUser className="mr-2 text-blue-400" />
                        <span className="font-semibold text-white">{booking.user?.name || 'N/A'}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-200">{booking.user?.email || 'N/A'}</span>
                      </div>

                      {/* Theater & Show Info */}
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5">
                          <FiHome className="mr-1.5 text-purple-400" />
                          <span className="text-white font-medium">{booking.showtime?.theater?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
                          <FiCalendar className="mr-1.5 text-orange-400" />
                          <span className="text-white font-medium">
                            {booking.showtime?.startTime
                              ? format(new Date(booking.showtime.startTime), 'MMM dd, yyyy • hh:mm a')
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Seats */}
                      <div className="text-sm bg-gray-700/30 border border-gray-600/30 rounded-lg px-3 py-2">
                        <span className="font-semibold text-gray-200">Seats:</span>{' '}
                        <span className="text-white font-medium">{booking.seats?.map(s => `${s.row}${s.seat}`).join(', ') || 'N/A'}</span>
                      </div>
                      
                      {/* Cancellation Info */}
                      {booking.paymentStatus === 'cancelled' && booking.cancelledAt && (
                        <div className="text-sm bg-red-900/30 border border-red-700/50 rounded-lg p-3 mt-2">
                          <span className="font-bold text-red-300">Cancelled on:</span>{' '}
                          <span className="text-red-200 font-medium">
                            {format(new Date(booking.cancelledAt), 'MMM dd, yyyy • hh:mm a')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Amount & Date */}
                    <div className="text-right space-y-2 bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20 rounded-lg p-4">
                      <div>
                        <p className="text-sm text-gray-300 font-medium">Amount</p>
                        <p className="text-3xl font-bold text-brand">
                          ₹{booking.totalAmount?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-xs text-gray-400">Booked on</p>
                        <p className="text-sm text-white font-medium">
                          {booking.createdAt
                            ? format(new Date(booking.createdAt), 'MMM dd, yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
