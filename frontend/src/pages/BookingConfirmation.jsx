import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookingAPI } from '../lib/api';

const BookingConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Check if this is a fresh booking (just after payment)
  const [isFromPayment, setIsFromPayment] = useState(false);

  useEffect(() => {
    // Check if coming from payment (URL parameter or session storage)
    const urlParams = new URLSearchParams(window.location.search);
    const fromPayment = urlParams.get('fromPayment') === 'true' || sessionStorage.getItem('fromPayment') === 'true';
    setIsFromPayment(fromPayment);
    
    // Clear the flag after checking
    if (fromPayment) {
      sessionStorage.removeItem('fromPayment');
    }
    
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const bookingData = await BookingAPI.get(id);
        setBooking(bookingData);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch booking details.');
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);
  
  // Helper function to get show status
  const getShowStatus = () => {
    if (!booking?.showtime) return null;
    
    const now = new Date();
    const startTime = new Date(booking.showtime.startTime);
    const endTime = new Date(booking.showtime.endTime);
    
    if (now < startTime) {
      return { status: 'upcoming', label: 'Active', color: 'blue' };
    } else if (now >= startTime && now < endTime) {
      return { status: 'ongoing', label: 'Ongoing', color: 'yellow' };
    } else {
      return { status: 'completed', label: 'Completed', color: 'gray' };
    }
  };
  
  // Handle rating submission
  const handleRatingSubmit = async (selectedRating) => {
    if (!selectedRating || submittingRating) return;
    
    setSubmittingRating(true);
    try {
      // TODO: Add API call to submit rating
      // await BookingAPI.rateMovie(booking._id, selectedRating);
      setRating(selectedRating);
      alert(`Thank you for rating this movie ${selectedRating} stars!`);
    } catch (err) {
      console.error('Failed to submit rating:', err);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold">Booking not found.</h2>
        </div>
      </div>
    );
  }

  // Add defensive checks for nested properties
  if (!booking.showtime || !booking.showtime.movie || !booking.showtime.theater) {
    return (
      <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            Booking data is incomplete. Please try refreshing the page.
          </div>
        </div>
      </div>
    );
  }

  // Check if booking is cancelled
  const isCancelled = booking.paymentStatus === 'cancelled';
  
  // Get show status
  const showStatus = getShowStatus();
  const isCompleted = showStatus?.status === 'completed' && booking.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Header - Different for cancelled vs confirmed */}
          {isCancelled ? (
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 md:p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 rounded-full p-3">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-center">
                Booking Cancelled
              </h1>
              <p className="text-center text-red-100 mt-2">
                Your booking has been cancelled and refund is being processed
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 md:p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 rounded-full p-3">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-center">
                Booking Confirmed!
              </h1>
              <p className="text-center text-green-100 mt-2">
                Your tickets have been booked successfully
              </p>
            </div>
          )}

          {/* Movie Details with Poster */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Movie Poster */}
              {booking.showtime?.movie?.poster && (
                <div className="flex-shrink-0 relative">
                  <img
                    src={booking.showtime.movie.poster}
                    alt={booking.showtime.movie.title}
                    className={`w-full md:w-48 h-64 md:h-72 object-cover rounded-lg shadow-lg ${
                      isCancelled ? 'grayscale' : ''
                    }`}
                  />
                  {isCancelled && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        CANCELLED
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Movie Info */}
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {booking.showtime?.movie?.title || 'N/A'}
                </h2>
                <div className="flex items-center flex-wrap gap-4 text-gray-400 mb-4">
                  {booking.showtime?.movie?.genre && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      {booking.showtime.movie.genre}
                    </span>
                  )}
                  {booking.showtime?.movie?.duration && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {booking.showtime.movie.duration} min
                    </span>
                  )}
                  {booking.showtime?.movie?.language && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                        />
                      </svg>
                      {booking.showtime.movie.language}
                    </span>
                  )}
                </div>
                
                {/* Movie Description */}
                {booking.showtime?.movie?.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {booking.showtime.movie.description}
                  </p>
                )}

                {/* Booking Details Grid */}
                <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <div>
                      <p className="text-gray-400 text-sm">Theater</p>
                      <p className="font-medium">{booking.showtime?.theater?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-gray-400 text-sm">Date & Time</p>
                      <p className="font-medium">
                        {booking.showtime?.startTime
                          ? new Date(booking.showtime.startTime).toLocaleString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-gray-400 text-sm">Seats</p>
                      <p className="font-medium">
                        {booking.seats && booking.seats.length > 0
                          ? booking.seats.map((s) => `${s.row}${s.seat}`).join(', ')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">
                {isCancelled ? 'Cancellation Details' : 'Payment Summary'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Booking ID</span>
                  <span className="font-mono text-sm">{booking._id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Number of Seats</span>
                  <span className="font-medium">{booking.seats?.length || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Status</span>
                  <span
                    className={`font-medium px-3 py-1 rounded-full text-sm ${
                      booking.paymentStatus === 'paid'
                        ? 'bg-green-900/50 text-green-300'
                        : booking.paymentStatus === 'pending'
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}
                  >
                    {booking.paymentStatus || 'Unknown'}
                  </span>
                </div>
                {isCancelled && booking.cancelledAt && (
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Cancelled On</span>
                    <span className="font-medium">
                      {new Date(booking.cancelledAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-4">
                  <span className="text-xl font-semibold">
                    {isCancelled ? 'Refund Amount' : 'Total Amount'}
                  </span>
                  <span className={`text-2xl font-bold ${isCancelled ? 'text-red-400' : 'text-green-400'}`}>
                    ₹{booking.totalAmount ? booking.totalAmount.toFixed(2) : '0.00'}
                  </span>
                </div>
                {isCancelled && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-red-300 font-medium mb-1">Refund Information</p>
                        <p className="text-red-200/80 text-sm">
                          Your refund of ₹{booking.totalAmount ? booking.totalAmount.toFixed(2) : '0.00'} will be processed within 5-7 business days to your original payment method.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Show Status Badge - Only show if not from payment and not cancelled */}
            {!isFromPayment && !isCancelled && showStatus && (
              <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Show Status</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      showStatus.color === 'blue'
                        ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                        : showStatus.color === 'yellow'
                        ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                        : 'bg-gray-900/30 text-gray-400 border border-gray-800/50'
                    }`}
                  >
                    {showStatus.label}
                  </span>
                </div>
                
                {/* Rating Section - Only show for completed shows */}
                {isCompleted && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-gray-300 mb-3">How was your experience?</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingSubmit(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          disabled={submittingRating || rating > 0}
                          className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                        >
                          <svg
                            className={`w-8 h-8 ${
                              star <= (hoveredRating || rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600'
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-sm text-green-400">
                          Thank you for your rating!
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Back to Home
              </button>
              <button
                onClick={() => navigate('/profile?tab=bookings')}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
