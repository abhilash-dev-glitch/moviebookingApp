import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { UsersAPI, BookingAPI } from '../lib/api';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from '../lib/toast';
import { checkAuth, logout } from '../store/authSlice';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => ({
    user: state.auth.user
  }));
  
  // Function to refresh user data
  const refreshUser = async () => {
    try {
      await dispatch(checkAuth()).unwrap();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Get initial tab from URL query parameter
  const initialTab = searchParams.get('tab') || 'profile';

  const [preview, setPreview] = useState(null);
  // ... (rest of the file is the same)
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const fileRef = useRef(null);

  useEffect(() => {
    setPreview(null);
    setName(user?.name || '');
    setEmail(user?.email || '');
    
    if (activeTab === 'bookings') {
      loadBookings();
    }
  }, [user?._id, activeTab]);
  
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await BookingAPI.myBookings();
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      toast.error('Error', 'Failed to load your bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const onPick = () => fileRef.current?.click();
  
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file', 'Please choose an image');
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      await UsersAPI.uploadProfilePicture(file);
      toast.success('Profile picture updated');
      await refreshUser();
      setPreview(null);
    } catch (err) {
      toast.error('Upload failed', err?.response?.data?.message || 'Please try again');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSave = async () => {
    if (!name?.trim() || !email?.trim()) {
      toast.error('Invalid input', 'Name and email are required');
      return;
    }
    setSaving(true);
    try {
      await UsersAPI.updateMe({ name: name.trim(), email: email.trim() });
      toast.success('Profile updated');
      await refreshUser();
    } catch (err) {
      toast.error('Update failed', err?.response?.data?.message || 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      await BookingAPI.cancelBooking(bookingId);
      toast.success('Booking cancelled', 'Your booking has been cancelled and refund will be processed');
      // Reload bookings to show updated status
      await loadBookings();
    } catch (err) {
      toast.error('Cancellation failed', err?.response?.data?.message || 'Please try again');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            My Account
          </h1>
          <p className="text-sm text-white/60 mt-1">
            {user?.role === 'admin' || user?.role === 'theaterManager' 
              ? 'Manage your profile settings'
              : 'Manage your profile and view booking history'}
          </p>
        </div>
        <button
          onClick={async () => {
            await dispatch(logout());
            navigate('/signin', { replace: true });
          }}
          className="mt-4 sm:mt-0 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-medium shadow-lg hover:shadow-red-500/20 transition-all duration-200 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <nav className="inline-flex space-x-1 p-1 bg-gray-900/80 rounded-xl border border-gray-700/50 shadow-lg shadow-black/20">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <svg
              className={`mr-2 h-5 w-5 transition-colors duration-300 ${
                activeTab === 'profile' ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={activeTab === 'profile' ? 2 : 1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile
          </button>
          {/* Hide My Bookings tab for admin and theater manager */}
          {user?.role !== 'admin' && user?.role !== 'theaterManager' && (
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'bookings'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <svg
                className={`mr-2 h-5 w-5 transition-colors duration-300 ${
                  activeTab === 'bookings' ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={activeTab === 'bookings' ? 2 : 1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              My Bookings
            </button>
          )}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid md:grid-cols-12 gap-8">
          {/* Left Column - Avatar */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 bg-white/5">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : user?.profilePicture || user?.photo ? (
                      <img
                        src={user.profilePicture || user.photo}
                        alt={user?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand/20 to-brand-dark/30">
                        <span className="text-4xl font-bold text-white/80">
                          {(user?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onPick}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 bg-brand hover:bg-brand-dark text-white p-2 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Change avatar"
                  >
                    {uploading ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    onChange={onFile}
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-white">
                  {user?.name || 'User'}
                </h2>
                <p className="text-sm text-white/60">{user?.email}</p>
                <p className="mt-1 text-xs text-white/40">
                  Member since {new Date(user?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-full">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-1">
                  Personal Information
                </h2>
                <p className="text-sm text-white/60">
                  Update your personal details here
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-white/80 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all duration-200"
                        placeholder="John Doe"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-white/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-white/80 mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all duration-200"
                        placeholder="john@example.com"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-white/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-brand to-brand-dark text-white font-medium rounded-lg shadow-lg hover:shadow-brand/30 hover:scale-[1.02] transform transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
                  >
                    {saving ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">My Bookings</h2>
                <p className="text-sm text-white/60 mt-1">
                  View and manage your movie bookings
                </p>
              </div>
              <Link
                to="/"
                className="mt-4 sm:mt-0 px-4 py-2.5 bg-gradient-to-r from-brand to-brand-dark text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-brand/30 hover:scale-[1.02] transform transition-all duration-200 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Book New Movie
              </Link>
            </div>

            {loadingBookings ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-xl">
                <svg
                  className="mx-auto h-12 w-12 text-white/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-white">
                  No bookings found
                </h3>
                <p className="mt-1 text-sm text-white/60 max-w-md mx-auto">
                  You haven't made any bookings yet. Browse our collection and book
                  your next movie experience.
                </p>
                <div className="mt-6">
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-brand to-brand-dark text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-brand/30 hover:scale-[1.02] transform transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16m-7 6h7"
                      />
                    </svg>
                    Browse Movies
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Active Bookings Section */}
                {bookings.filter(b => b.paymentStatus !== 'cancelled').length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Active Bookings
                    </h3>
                    <div className="space-y-4">
                      {bookings.filter(b => b.paymentStatus !== 'cancelled').map((booking) => (
                        <div
                          key={booking._id}
                          className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-brand/10"
                        >
                          <div className="flex flex-col md:flex-row">
                            {/* Movie Poster */}
                            {(booking.showtime?.movie?.poster || booking.movie?.poster) && (
                              <div className="flex-shrink-0 w-full md:w-32 h-48 md:h-auto">
                                <img
                                  src={booking.showtime?.movie?.poster || booking.movie?.poster}
                                  alt={booking.showtime?.movie?.title || booking.movie?.title || 'Movie'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            {/* Booking Details */}
                            <div className="flex-1 p-5">
                              <div className="flex flex-col md:flex-row md:items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center flex-wrap gap-2">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-brand transition-colors duration-200">
                                      {booking.showtime?.movie?.title || booking.movie?.title || 'Movie'}
                                    </h3>
                                    {/* Payment Status Badge */}
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        booking.paymentStatus === 'paid'
                                          ? 'bg-green-900/30 text-green-400 border border-green-800/50'
                                          : booking.paymentStatus === 'cancelled'
                                          ? 'bg-red-900/30 text-red-400 border border-red-800/50'
                                          : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                                      }`}
                                    >
                                      {(booking.paymentStatus || 'pending')?.charAt(0).toUpperCase() +
                                        (booking.paymentStatus || 'pending')?.slice(1)}
                                    </span>
                                    {/* Show Status Badge (Active/Ongoing/Completed) */}
                                    {booking.paymentStatus === 'paid' && (() => {
                                      const now = new Date();
                                      const startTime = booking.showtime?.startTime 
                                        ? new Date(booking.showtime.startTime)
                                        : null;
                                      const endTime = booking.showtime?.endTime 
                                        ? new Date(booking.showtime.endTime)
                                        : null;
                                      
                                      let status, color;
                                      if (!startTime || !endTime) {
                                        return null;
                                      } else if (now < startTime) {
                                        status = 'Active';
                                        color = 'blue';
                                      } else if (now >= startTime && now < endTime) {
                                        status = 'Ongoing';
                                        color = 'yellow';
                                      } else {
                                        status = 'Completed';
                                        color = 'gray';
                                      }
                                      
                                      return (
                                        <span
                                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            color === 'blue'
                                              ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                                              : color === 'yellow'
                                              ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                                              : 'bg-gray-900/30 text-gray-400 border border-gray-800/50'
                                          }`}
                                        >
                                          {status}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  
                                  {/* Movie Details */}
                                  {(booking.showtime?.movie?.genre || booking.showtime?.movie?.duration) && (
                                    <div className="mt-2 flex items-center text-sm text-white/60 gap-3">
                                      {booking.showtime?.movie?.genre && (
                                        <span className="flex items-center">
                                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                          </svg>
                                          {booking.showtime.movie.genre}
                                        </span>
                                      )}
                                      {booking.showtime?.movie?.duration && (
                                        <span className="flex items-center">
                                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {booking.showtime.movie.duration} min
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="mt-3 flex flex-wrap items-center text-sm text-white/70 gap-y-2">
                                    <div className="flex items-center mr-4">
                                      <svg
                                        className="h-4 w-4 mr-1.5 text-white/50"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        />
                                      </svg>
                                      {booking.showtime?.theater?.name || booking.theater?.name || 'Theater'}
                                    </div>
                                    <div className="flex items-center mr-4">
                                      <svg
                                        className="h-4 w-4 mr-1.5 text-white/50"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      {formatDate(booking.showtime?.startTime) || 'N/A'}
                                    </div>
                                    <div className="flex items-center">
                                      <svg
                                        className="h-4 w-4 mr-1.5 text-white/50"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                      </svg>
                                      {booking.seats?.length || '0'} seat{booking.seats?.length !== 1 ? 's' : ''} • {booking.seats?.map((s) => `${s.row}${s.seat}`).join(', ')}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-3">
                                  <div className="text-left md:text-right">
                                    <p className="text-sm text-white/60">Total Amount</p>
                                    <p className="text-xl font-bold text-brand">
                                      ₹{booking.totalAmount?.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Link
                                      to={`/bookings/${booking._id}`}
                                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center group-hover:border-brand/50 group-hover:text-brand"
                                    >
                                      <span>View</span>
                                      <svg
                                        className="ml-2 h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </Link>
                                    {/* Cancel Button - Only show for paid bookings before show starts */}
                                    {booking.paymentStatus === 'paid' && (() => {
                                      const now = new Date();
                                      const showStartTime = booking.showtime?.startTime 
                                        ? new Date(booking.showtime.startTime)
                                        : null;
                                      const canCancel = showStartTime && showStartTime > now;
                                      
                                      if (canCancel) {
                                        return (
                                          <button
                                            onClick={() => handleCancelBooking(booking._id)}
                                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
                                          >
                                            <svg
                                              className="mr-2 h-4 w-4"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                              />
                                            </svg>
                                            Cancel
                                          </button>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancelled Bookings Section */}
                {bookings.filter(b => b.paymentStatus === 'cancelled').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cancelled Bookings
                    </h3>
                    <div className="space-y-4">
                      {bookings.filter(b => b.paymentStatus === 'cancelled').map((booking) => (
                        <div
                          key={booking._id}
                          className="bg-white/5 border border-red-900/30 rounded-xl overflow-hidden opacity-75"
                        >
                          <div className="flex flex-col md:flex-row">
                            {/* Movie Poster */}
                            {(booking.showtime?.movie?.poster || booking.movie?.poster) && (
                              <div className="flex-shrink-0 w-full md:w-32 h-48 md:h-auto relative">
                                <img
                                  src={booking.showtime?.movie?.poster || booking.movie?.poster}
                                  alt={booking.showtime?.movie?.title || booking.movie?.title || 'Movie'}
                                  className="w-full h-full object-cover grayscale"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                    CANCELLED
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Booking Details */}
                            <div className="flex-1 p-5">
                              <div className="flex flex-col md:flex-row md:items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center flex-wrap gap-2">
                                    <h3 className="text-lg font-semibold text-white/80">
                                      {booking.showtime?.movie?.title || booking.movie?.title || 'Movie'}
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/50">
                                      Cancelled
                                    </span>
                                  </div>
                                  
                                  <div className="mt-3 flex flex-wrap items-center text-sm text-white/60 gap-y-2">
                                    <div className="flex items-center mr-4">
                                      <svg className="h-4 w-4 mr-1.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                      {booking.showtime?.theater?.name || booking.theater?.name || 'Theater'}
                                    </div>
                                    <div className="flex items-center mr-4">
                                      <svg className="h-4 w-4 mr-1.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {formatDate(booking.showtime?.startTime) || 'N/A'}
                                    </div>
                                    <div className="flex items-center">
                                      <svg className="h-4 w-4 mr-1.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      {booking.seats?.length || '0'} seat{booking.seats?.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-3">
                                  <div className="text-left md:text-right">
                                    <p className="text-sm text-white/60">Refunded</p>
                                    <p className="text-xl font-bold text-white/70 line-through">
                                      ₹{booking.totalAmount?.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                  <Link
                                    to={`/bookings/${booking._id}`}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
                                  >
                                    <span>View</span>
                                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}