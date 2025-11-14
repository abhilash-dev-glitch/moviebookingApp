import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { BookingAPI } from '../lib/api';
import { toast } from '../lib/toast';
import StripePaymentForm from '../components/checkout/StripePaymentForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutPage = () => {
  const { bookingId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        if (bookingId) {
          const bookingData = await BookingAPI.get(bookingId);
          setBooking(bookingData);
          setShowtime(bookingData.showtime);
          setSeats(bookingData.seats || []);
        } else if (state?.showtime && state?.seats) {
          setShowtime(state.showtime);
          setSeats(state.seats);
        }
      } catch (error) {
        console.error('Error initializing checkout:', error);
        toast.error('Error', 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [bookingId, state]);

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      let createdBookingId = bookingId;
      
      if (!createdBookingId) {
        const booking = await BookingAPI.create({
          showtime: showtime._id,
          seats: seats.map(s => ({ row: s.row, seat: s.seat, price: s.price })),
          paymentMethod: 'card',
          paymentStatus: 'paid',
          amount: paymentResult.amount / 100
        });
        createdBookingId = booking._id;
      }

      toast.success('Success', 'Payment successful!');
      navigate(`/bookings/${createdBookingId}`);
    } catch (error) {
      console.error('Error processing booking:', error);
      toast.error('Error', 'Failed to process booking');
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    toast.error('Payment Failed', error || 'Something went wrong. Please try again.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!showtime || seats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Booking</h2>
          <p className="text-gray-400">The booking details are incomplete or invalid.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Movie</span>
                <span className="font-medium">{showtime.movie?.title || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Date & Time</span>
                <span className="font-medium">
                  {new Date(showtime.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Theater</span>
                <span className="font-medium">{showtime.theater?.name || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Seats</span>
                <span className="font-medium">
                  {seats.map(s => `${s.row}${s.seat}`).join(', ')}
                </span>
              </div>
              
              <div className="border-t border-gray-700 my-4"></div>
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Section */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
            
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                amount={totalAmount * 100} // Convert to cents
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
