import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from '../../lib/toast';
import {
  FiXCircle,
  FiUser,
  FiFilm,
  FiHome,
  FiCalendar,
  FiLoader,
  FiAlertCircle,
  FiClock,
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import { format } from 'date-fns';

export default function AdminCancellations() {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    totalRefund: 0,
  });

  const fetchCancellations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getBookings();
      const allBookings = response.data?.bookings || [];
      
      // Filter only cancelled bookings
      const cancelledBookings = allBookings.filter(b => b.paymentStatus === 'cancelled');
      setCancellations(cancelledBookings);
      
      // Calculate stats
      const stats = {
        total: cancelledBookings.length,
        totalRefund: cancelledBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      };
      setStats(stats);
    } catch (err) {
      console.error('Error fetching cancellations:', err);
      setError(err.response?.data?.message || 'Failed to load cancellations');
      toast.error('Failed to load cancellations', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancellations();
  }, []);

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
          onClick={fetchCancellations}
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
          Cancelled Bookings
        </h1>
        <p className="text-sm text-red-700 mt-1">
          View all cancelled bookings and refund details
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 backdrop-blur-sm rounded-xl border-2 border-red-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-200 font-bold">Total Cancellations</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <FiXCircle className="text-red-400 text-3xl" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 backdrop-blur-sm rounded-xl border-2 border-red-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-200 font-bold">Total Refund Amount</p>
              <p className="text-3xl font-bold text-white mt-1">₹{stats.totalRefund.toLocaleString()}</p>
            </div>
            <TbCurrencyRupee className="text-red-400 text-3xl" />
          </div>
        </div>
      </div>

      {/* Cancellations List */}
      {cancellations.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/30 border-2 border-dashed border-gray-700 rounded-lg">
          <FiXCircle className="mx-auto text-5xl text-gray-500 mb-3" />
          <h3 className="text-xl font-semibold text-white">No Cancellations Found</h3>
          <p className="text-gray-400 mt-1">
            No bookings have been cancelled yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cancellations.map((booking) => (
            <div
              key={booking._id}
              className="bg-gradient-to-br from-red-950/40 to-gray-900/90 backdrop-blur-sm rounded-xl border border-red-700/40 overflow-hidden hover:border-red-600/60 hover:shadow-lg hover:shadow-red-900/30 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row">
                {/* Movie Poster with Cancelled Overlay */}
                {booking.showtime?.movie?.poster && (
                  <div className="flex-shrink-0 w-full md:w-32 h-48 md:h-auto relative">
                    <img
                      src={booking.showtime.movie.poster}
                      alt={booking.showtime.movie.title}
                      className="w-full h-full object-cover grayscale"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                        CANCELLED
                      </span>
                    </div>
                  </div>
                )}

                {/* Booking Details */}
                <div className="flex-1 p-5 bg-black/30">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Movie & Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FiFilm className="text-red-400" />
                            {booking.showtime?.movie?.title || 'N/A'}
                          </h3>
                          <p className="text-sm text-gray-300 mt-1 font-mono">
                            ID: {booking._id}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-900/50 text-red-200 border-2 border-red-700/60">
                          <FiXCircle className="w-4 h-4 mr-1.5" />
                          Cancelled
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center text-sm bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
                        <FiUser className="mr-2 text-blue-400" />
                        <span className="font-semibold text-white">{booking.user?.name || 'N/A'}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-200">{booking.user?.email || 'N/A'}</span>
                      </div>

                      {/* Theater & Show Info */}
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-1.5">
                          <FiHome className="mr-1.5 text-purple-400" />
                          <span className="text-white font-medium">{booking.showtime?.theater?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-1.5">
                          <FiCalendar className="mr-1.5 text-orange-400" />
                          <span className="text-white font-medium">
                            {booking.showtime?.startTime
                              ? format(new Date(booking.showtime.startTime), 'MMM dd, yyyy • hh:mm a')
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Seats */}
                      <div className="text-sm bg-gray-700/40 border border-gray-600/40 rounded-lg px-3 py-2">
                        <span className="font-semibold text-gray-200">Seats:</span>{' '}
                        <span className="text-white font-medium">{booking.seats?.map(s => `${s.row}${s.seat}`).join(', ') || 'N/A'}</span>
                      </div>
                      
                      {/* Cancellation Details */}
                      <div className="bg-red-900/40 border-2 border-red-700/60 rounded-lg p-3 space-y-2">
                        <div className="flex items-center text-sm">
                          <FiClock className="mr-2 text-red-300" />
                          <span className="font-bold text-red-200">Cancelled on:</span>
                          <span className="ml-2 text-white font-semibold">
                            {booking.cancelledAt
                              ? format(new Date(booking.cancelledAt), 'MMM dd, yyyy • hh:mm a')
                              : booking.updatedAt
                              ? format(new Date(booking.updatedAt), 'MMM dd, yyyy • hh:mm a')
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-red-200/90 font-medium">
                          Refund will be processed within 5-7 business days
                        </div>
                      </div>
                    </div>

                    {/* Refund Amount */}
                    <div className="text-right space-y-2 bg-gradient-to-br from-red-900/30 to-red-950/20 border-2 border-red-700/40 rounded-lg p-4">
                      <div>
                        <p className="text-sm text-red-200 font-semibold">Refund Amount</p>
                        <p className="text-3xl font-bold text-red-400">
                          ₹{booking.totalAmount?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-red-700/30">
                        <p className="text-xs text-gray-400">Originally Booked</p>
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
