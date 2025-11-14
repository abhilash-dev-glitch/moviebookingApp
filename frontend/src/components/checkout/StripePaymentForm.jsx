import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

export const StripePaymentForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (error) {
        throw new Error(error.message);
      }

      // Simulate server-side processing
      setTimeout(() => {
        onSuccess({
          id: `pi_${Math.random().toString(36).substring(2, 15)}`,
          amount,
          status: 'succeeded'
        });
      }, 1500);
      
    } catch (error) {
      console.error('Payment error:', error);
      onError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-800/50 p-4 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': { color: '#9ca3af' },
              },
              invalid: { color: '#ef4444' },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
          processing ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {processing ? 'Processing...' : `Pay ₹${(amount / 100).toFixed(2)}`}
      </button>
    </form>
  );
};

export default StripePaymentForm;
