# Payment Integration Guide

Complete guide for payment gateway integration in the Movie Booking Backend.

## 🎯 Overview

The backend supports multiple payment gateways:
- **Stripe** - International payments (Credit/Debit cards)
- **Razorpay** - Indian payments (Cards, UPI, Net Banking, Wallets)
- **Mock Payment** - Testing without real gateways

---

## 🔧 Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CURRENCY=usd

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_CURRENCY=INR

# Mock Payment (for testing)
ENABLE_MOCK_PAYMENT=true
```

### 2. Get API Keys

#### Stripe
1. Sign up at [stripe.com](https://stripe.com)
2. Get test keys from Dashboard → Developers → API keys
3. Get webhook secret from Dashboard → Developers → Webhooks

#### Razorpay
1. Sign up at [razorpay.com](https://razorpay.com)
2. Get test keys from Settings → API Keys
3. Generate webhook secret from Settings → Webhooks

---

## 📊 Payment Flow

### Standard Payment Flow

```
1. User creates booking
   ↓
2. User initiates payment
   POST /api/v1/payments/create
   ↓
3. Frontend receives payment intent/order
   ↓
4. User completes payment on gateway
   ↓
5. Frontend verifies payment
   POST /api/v1/payments/verify
   ↓
6. Booking status updated to 'paid'
   ↓
7. User receives confirmation
```

### Webhook Flow (Background)

```
Payment Gateway
   ↓
Webhook notification
   ↓
POST /api/v1/webhooks/stripe or /razorpay
   ↓
Payment status updated
   ↓
Booking status updated
```

---

## 🔌 API Endpoints

### 1. Get Available Payment Gateways

**GET** `/api/v1/payments/gateways`

**Access:** Public

**Response:**
```json
{
  "status": "success",
  "data": {
    "gateways": ["stripe", "razorpay", "mock"],
    "config": {
      "stripe": {
        "currency": "USD"
      },
      "razorpay": {
        "currency": "INR"
      },
      "mock": {
        "enabled": true
      }
    }
  }
}
```

### 2. Create Payment

**POST** `/api/v1/payments/create`

**Access:** Private

**Request Body:**
```json
{
  "bookingId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "paymentGateway": "stripe",
  "paymentMethod": "credit_card"
}
```

**Response (Stripe):**
```json
{
  "status": "success",
  "data": {
    "payment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "transactionId": "TXN_ABC123",
      "amount": 24.00,
      "currency": "USD",
      "status": "pending"
    },
    "gatewayResponse": {
      "id": "pi_abc123",
      "clientSecret": "pi_abc123_secret_xyz",
      "amount": 2400,
      "currency": "usd"
    }
  }
}
```

**Response (Razorpay):**
```json
{
  "status": "success",
  "data": {
    "payment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "transactionId": "TXN_ABC123",
      "amount": 500,
      "currency": "INR",
      "status": "pending"
    },
    "gatewayResponse": {
      "id": "order_abc123",
      "amount": 50000,
      "currency": "INR",
      "key": "rzp_test_abc123"
    }
  }
}
```

### 3. Verify Payment

**POST** `/api/v1/payments/verify`

**Access:** Private

**Request Body (Stripe):**
```json
{
  "paymentId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "gatewayPaymentId": "pi_abc123"
}
```

**Request Body (Razorpay):**
```json
{
  "paymentId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "gatewayPaymentId": "pay_abc123",
  "gatewayOrderId": "order_abc123",
  "signature": "razorpay_signature_here"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Payment verified successfully",
  "data": {
    "payment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "status": "completed",
      "completedAt": "2024-01-15T10:30:00.000Z"
    },
    "booking": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "paymentStatus": "paid"
    }
  }
}
```

### 4. Get Payment Details

**GET** `/api/v1/payments/:id`

**Access:** Private (Owner/Admin)

**Response:**
```json
{
  "status": "success",
  "data": {
    "payment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "transactionId": "TXN_ABC123",
      "amount": 24.00,
      "currency": "USD",
      "paymentGateway": "stripe",
      "paymentMethod": "credit_card",
      "status": "completed",
      "paymentDetails": {
        "cardLast4": "4242",
        "cardBrand": "visa"
      },
      "booking": {
        "showtime": {
          "movie": {
            "title": "Inception"
          }
        }
      }
    }
  }
}
```

### 5. Get My Payments

**GET** `/api/v1/payments/my-payments`

**Access:** Private

**Response:**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "payments": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "transactionId": "TXN_ABC123",
        "amount": 24.00,
        "status": "completed",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### 6. Initiate Refund

**POST** `/api/v1/payments/:id/refund`

**Access:** Private (Owner/Admin)

**Request Body:**
```json
{
  "reason": "User requested cancellation"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Refund initiated successfully",
  "data": {
    "payment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "status": "refunded",
      "refund": {
        "refundId": "re_abc123",
        "refundAmount": 24.00,
        "refundDate": "2024-01-15T12:00:00.000Z",
        "refundReason": "User requested cancellation",
        "refundStatus": "processing"
      }
    },
    "refundAmount": 24.00
  }
}
```

### 7. Get All Payments (Admin)

**GET** `/api/v1/payments`

**Access:** Private/Admin

---

## 🎨 Frontend Integration

### Stripe Integration

```javascript
// 1. Create payment
const response = await fetch('/api/v1/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    bookingId: 'booking_id',
    paymentGateway: 'stripe',
    paymentMethod: 'credit_card'
  })
});

const { data } = await response.json();
const { clientSecret } = data.gatewayResponse;

// 2. Use Stripe.js to handle payment
const stripe = Stripe('pk_test_your_publishable_key');
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Customer Name'
    }
  }
});

// 3. Verify payment
if (paymentIntent.status === 'succeeded') {
  await fetch('/api/v1/payments/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      paymentId: data.payment._id,
      gatewayPaymentId: paymentIntent.id
    })
  });
}
```

### Razorpay Integration

```javascript
// 1. Create payment
const response = await fetch('/api/v1/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    bookingId: 'booking_id',
    paymentGateway: 'razorpay',
    paymentMethod: 'upi'
  })
});

const { data } = await response.json();
const { gatewayResponse } = data;

// 2. Use Razorpay Checkout
const options = {
  key: gatewayResponse.key,
  amount: gatewayResponse.amount,
  currency: gatewayResponse.currency,
  order_id: gatewayResponse.id,
  handler: async function (response) {
    // 3. Verify payment
    await fetch('/api/v1/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        paymentId: data.payment._id,
        gatewayPaymentId: response.razorpay_payment_id,
        gatewayOrderId: response.razorpay_order_id,
        signature: response.razorpay_signature
      })
    });
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

### Mock Payment (Testing)

```javascript
// 1. Create payment
const response = await fetch('/api/v1/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    bookingId: 'booking_id',
    paymentGateway: 'mock',
    paymentMethod: 'credit_card'
  })
});

const { data } = await response.json();

// 2. Simulate payment success (no actual payment)
await new Promise(resolve => setTimeout(resolve, 2000));

// 3. Verify payment
await fetch('/api/v1/payments/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    paymentId: data.payment._id,
    gatewayPaymentId: data.gatewayResponse.paymentId
  })
});
```

---

## 🔔 Webhook Setup

### Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/v1/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `payment_intent.canceled`
4. Copy webhook signing secret to `.env`

### Razorpay Webhooks

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/v1/webhooks/razorpay`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
4. Copy webhook secret to `.env`

### Testing Webhooks Locally

Use ngrok or similar tool:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Use the ngrok URL for webhooks
https://abc123.ngrok.io/api/v1/webhooks/stripe
```

---

## 💰 Refund Policy

The system implements a time-based refund policy:

| Time Before Showtime | Refund Percentage |
|---------------------|-------------------|
| 24+ hours           | 100%              |
| 12-24 hours         | 75%               |
| 2-12 hours          | 50%               |
| < 2 hours           | 0% (No refund)    |

This is implemented in the `Payment` model's `calculateRefundAmount()` method.

---

## 🧪 Testing

### Test Cards

**Stripe:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

**Razorpay:**
- Success: Any valid card number
- Failure: Use test mode failure scenarios

### Mock Payment

Enable in `.env`:
```env
ENABLE_MOCK_PAYMENT=true
```

Mock payment always succeeds instantly without real payment processing.

---

## 🔒 Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Always verify payments** on the backend
3. **Use webhook signatures** to verify authenticity
4. **Implement rate limiting** on payment endpoints
5. **Log all payment attempts** for audit trail
6. **Use HTTPS** in production
7. **Validate amounts** on backend before processing
8. **Store minimal card data** (only last 4 digits)

---

## 📊 Payment Model Schema

```javascript
{
  booking: ObjectId,           // Reference to booking
  user: ObjectId,              // Reference to user
  amount: Number,              // Payment amount
  currency: String,            // Currency code
  paymentGateway: String,      // stripe/razorpay/mock
  paymentMethod: String,       // credit_card/upi/etc
  status: String,              // pending/completed/failed/refunded
  transactionId: String,       // Unique transaction ID
  gatewayPaymentId: String,    // Gateway's payment ID
  gatewayOrderId: String,      // Gateway's order ID
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    upiId: String
  },
  refund: {
    refundId: String,
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,
    refundStatus: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String
  }
}
```

---

## 🐛 Troubleshooting

### Payment Creation Fails

**Issue:** "Payment gateway not available"
**Solution:** Check if gateway is configured in `.env` and keys are valid

### Payment Verification Fails

**Issue:** "Payment verification failed"
**Solution:** 
- Check if payment was actually completed on gateway
- Verify signature (Razorpay)
- Check payment intent status (Stripe)

### Webhooks Not Working

**Issue:** Webhooks not received
**Solution:**
- Verify webhook URL is accessible
- Check webhook secret is correct
- Use ngrok for local testing
- Check webhook logs in gateway dashboard

### Refund Fails

**Issue:** "This payment cannot be refunded"
**Solution:**
- Check if payment status is 'completed'
- Verify payment hasn't been refunded already
- Check if within refund time window

---

## 📈 Monitoring

### Important Metrics to Track

1. **Payment Success Rate**
   - Track completed vs failed payments
   
2. **Average Payment Time**
   - Time from initiation to completion
   
3. **Refund Rate**
   - Percentage of payments refunded
   
4. **Gateway Performance**
   - Compare success rates across gateways

### Logging

All payment operations are logged with:
- Transaction ID
- User ID
- Amount
- Status changes
- Error messages

---

## 🚀 Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Configure production webhook URLs
- [ ] Enable HTTPS
- [ ] Set up monitoring and alerts
- [ ] Test payment flow end-to-end
- [ ] Test refund flow
- [ ] Configure rate limiting
- [ ] Set up payment reconciliation
- [ ] Document payment processes
- [ ] Train support team

---

## 📞 Support

For payment-related issues:
1. Check transaction logs
2. Verify gateway dashboard
3. Check webhook delivery
4. Review error messages
5. Contact gateway support if needed

---

**Payment system is production-ready!** 💳✨
