import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersAPI, BookingAPI } from '../lib/api';
import { useAuth } from '../store/auth';
import { toast } from '../lib/toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const refreshMe = useAuth(s => s.init);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
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
      await refreshMe();
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
      await refreshMe();
    } catch (err) {
      toast.error('Update failed', err?.response?.data?.message || 'Please try again');
    } finally {
      setSaving(false);
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
            Manage your profile and view booking history
          </p>
        </div>
        <button
          onClick={logout}
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
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-brand/10"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-white group-hover:text-brand transition-colors duration-200">
                            {booking.movie?.title || 'Movie'}
                          </h3>
                          <span
                            className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed'
                                ? 'bg-green-900/30 text-green-400 border border-green-800/50'
                                : booking.status === 'cancelled'
                                ? 'bg-red-900/30 text-red-400 border border-red-800/50'
                                : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                            }`}
                          >
                            {booking.status?.charAt(0).toUpperCase() +
                              booking.status?.slice(1)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center text-sm text-white/70 gap-y-1">
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
                            {booking.theater?.name || 'Theater'}
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {booking.seats?.length || '0'} seat{
                              booking.seats?.length !== 1 ? 's' : ''
                            }
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm text-white/60">Total</p>
                          <p className="text-xl font-bold text-brand">
                            ${booking.totalAmount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <Link
                          to={`/bookings/${booking._id}`}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center group-hover:border-brand/50 group-hover:text-brand"
                        >
                          <span>View Details</span>
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
