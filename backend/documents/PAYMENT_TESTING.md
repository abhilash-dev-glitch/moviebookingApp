# Payment Testing Guide

Complete guide for testing payment functionality in the Movie Booking Backend.

---

## 🎯 Testing Scenarios

### Scenario 1: Complete Payment Flow (Mock)

**Purpose:** Test end-to-end payment without real gateway

**Steps:**

1. **Enable Mock Payment**
   ```env
   ENABLE_MOCK_PAYMENT=true
   ```

2. **Create a Booking**
   ```bash
   curl -X POST http://localhost:3000/api/v1/bookings \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "showtime": "SHOWTIME_ID",
       "seats": [
         { "row": 5, "seat": 10 },
         { "row": 5, "seat": 11 }
       ],
       "paymentMethod": "credit_card"
     }'
   ```

3. **Create Payment**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "bookingId": "BOOKING_ID",
       "paymentGateway": "mock",
       "paymentMethod": "credit_card"
     }'
   ```

4. **Verify Payment**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/verify \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "paymentId": "PAYMENT_ID",
       "gatewayPaymentId": "GATEWAY_PAYMENT_ID"
     }'
   ```

5. **Verify Booking Status**
   ```bash
   curl http://localhost:3000/api/v1/bookings/BOOKING_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Expected Results:**
- ✅ Payment status: `completed`
- ✅ Booking paymentStatus: `paid`
- ✅ Transaction ID generated
- ✅ Payment details stored

---

### Scenario 2: Stripe Payment Flow

**Prerequisites:**
- Stripe test account
- Test API keys configured
- Stripe.js on frontend

**Steps:**

1. **Get Available Gateways**
   ```bash
   curl http://localhost:3000/api/v1/payments/gateways
   ```

2. **Create Payment Intent**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "bookingId": "BOOKING_ID",
       "paymentGateway": "stripe",
       "paymentMethod": "credit_card"
     }'
   ```

3. **Use Test Cards**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires Auth: `4000 0025 0000 3155`

4. **Verify Payment**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/verify \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "paymentId": "PAYMENT_ID",
       "gatewayPaymentId": "pi_xxx"
     }'
   ```

**Expected Results:**
- ✅ Payment intent created
- ✅ Client secret returned
- ✅ Payment verified successfully
- ✅ Card details stored (last 4 digits only)

---

### Scenario 3: Razorpay Payment Flow

**Prerequisites:**
- Razorpay test account
- Test API keys configured
- Razorpay Checkout on frontend

**Steps:**

1. **Create Razorpay Order**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "bookingId": "BOOKING_ID",
       "paymentGateway": "razorpay",
       "paymentMethod": "upi"
     }'
   ```

2. **Complete Payment on Razorpay**
   - Use test UPI ID: `success@razorpay`
   - Or test card: Any valid card number

3. **Verify with Signature**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/verify \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "paymentId": "PAYMENT_ID",
       "gatewayPaymentId": "pay_xxx",
       "gatewayOrderId": "order_xxx",
       "signature": "razorpay_signature"
     }'
   ```

**Expected Results:**
- ✅ Order created with Razorpay
- ✅ Payment captured
- ✅ Signature verified
- ✅ Payment method details stored

---

### Scenario 4: Payment Failure Handling

**Purpose:** Test payment failure scenarios

**Test Cases:**

#### 4.1 Declined Card (Stripe)
```bash
# Use declined test card: 4000 0000 0000 0002
# Expected: Payment status = 'failed'
```

#### 4.2 Insufficient Funds
```bash
# Use Stripe test card: 4000 0000 0000 9995
# Expected: Payment fails with appropriate error
```

#### 4.3 Invalid Payment Gateway
```bash
curl -X POST http://localhost:3000/api/v1/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bookingId": "BOOKING_ID",
    "paymentGateway": "invalid_gateway",
    "paymentMethod": "credit_card"
  }'
# Expected: 400 error - "Payment gateway not available"
```

#### 4.4 Already Paid Booking
```bash
# Try to create payment for already paid booking
# Expected: 400 error - "This booking is already paid"
```

**Expected Results:**
- ✅ Appropriate error messages
- ✅ Payment status updated to 'failed'
- ✅ Error details logged
- ✅ Booking remains unpaid

---

### Scenario 5: Refund Flow

**Purpose:** Test refund processing

**Steps:**

1. **Complete a Payment First**
   ```bash
   # Follow Scenario 1 to create and complete payment
   ```

2. **Initiate Refund (24+ hours before show)**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/PAYMENT_ID/refund \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "reason": "User requested cancellation"
     }'
   ```

3. **Check Refund Amount**
   - 24+ hours: 100% refund
   - 12-24 hours: 75% refund
   - 2-12 hours: 50% refund
   - < 2 hours: No refund

4. **Verify Refund Status**
   ```bash
   curl http://localhost:3000/api/v1/payments/PAYMENT_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Expected Results:**
- ✅ Refund initiated
- ✅ Correct refund amount calculated
- ✅ Refund status: 'processing'
- ✅ Booking status: 'refunded'
- ✅ Seats released

---

### Scenario 6: Webhook Testing

**Purpose:** Test webhook event handling

#### 6.1 Stripe Webhook

1. **Install Stripe CLI**
   ```bash
   stripe login
   ```

2. **Forward Webhooks to Local**
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
   ```

3. **Trigger Test Event**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

4. **Check Logs**
   ```bash
   # Check server logs for webhook processing
   ```

#### 6.2 Razorpay Webhook

1. **Use ngrok for Local Testing**
   ```bash
   ngrok http 3000
   ```

2. **Configure Webhook URL**
   - Add ngrok URL to Razorpay dashboard
   - URL: `https://xxx.ngrok.io/api/v1/webhooks/razorpay`

3. **Trigger Test Payment**
   - Complete a test payment
   - Check webhook delivery in Razorpay dashboard

**Expected Results:**
- ✅ Webhook received
- ✅ Signature verified
- ✅ Payment status updated
- ✅ Event logged

---

### Scenario 7: Concurrent Payment Attempts

**Purpose:** Test race conditions

**Steps:**

1. **Create Multiple Payment Attempts**
   ```bash
   # Run these simultaneously
   curl -X POST http://localhost:3000/api/v1/payments/create ... &
   curl -X POST http://localhost:3000/api/v1/payments/create ... &
   ```

2. **Verify Only One Succeeds**

**Expected Results:**
- ✅ Only one payment created
- ✅ Others fail with appropriate error
- ✅ No duplicate charges

---

### Scenario 8: Payment Timeout

**Purpose:** Test abandoned payments

**Steps:**

1. **Create Payment**
   ```bash
   # Create payment but don't complete it
   ```

2. **Wait 30 Minutes**

3. **Try to Verify**
   ```bash
   # Attempt verification after timeout
   ```

**Expected Results:**
- ✅ Payment remains in 'pending' state
- ✅ Can create new payment for same booking
- ✅ Old payment can be cancelled

---

### Scenario 9: Multiple Payment Methods

**Purpose:** Test different payment methods

**Test Each Method:**

```bash
# Credit Card
"paymentMethod": "credit_card"

# Debit Card
"paymentMethod": "debit_card"

# UPI (Razorpay)
"paymentMethod": "upi"

# Net Banking
"paymentMethod": "net_banking"

# Wallet
"paymentMethod": "wallet"
```

**Expected Results:**
- ✅ All methods work correctly
- ✅ Method details stored appropriately
- ✅ Correct gateway used

---

### Scenario 10: Admin Payment Management

**Purpose:** Test admin payment operations

**Steps:**

1. **Get All Payments**
   ```bash
   curl http://localhost:3000/api/v1/payments \
     -H "Authorization: Bearer ADMIN_TOKEN"
   ```

2. **View Any User's Payment**
   ```bash
   curl http://localhost:3000/api/v1/payments/PAYMENT_ID \
     -H "Authorization: Bearer ADMIN_TOKEN"
   ```

3. **Process Refund for Any User**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/PAYMENT_ID/refund \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -d '{"reason": "Admin initiated refund"}'
   ```

**Expected Results:**
- ✅ Admin can view all payments
- ✅ Admin can process refunds
- ✅ Regular users cannot access others' payments

---

## 🧪 Automated Test Script

Create `test-payments.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"
TOKEN="your_test_token"

echo "=== Payment System Tests ==="

# Test 1: Get Available Gateways
echo -e "\n1. Testing Available Gateways"
curl -s "$BASE_URL/payments/gateways" | jq

# Test 2: Create Mock Payment
echo -e "\n2. Creating Mock Payment"
PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/payments/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "bookingId": "'"$BOOKING_ID"'",
    "paymentGateway": "mock",
    "paymentMethod": "credit_card"
  }')
echo $PAYMENT_RESPONSE | jq

PAYMENT_ID=$(echo $PAYMENT_RESPONSE | jq -r '.data.payment._id')
GATEWAY_PAYMENT_ID=$(echo $PAYMENT_RESPONSE | jq -r '.data.gatewayResponse.paymentId')

# Test 3: Verify Payment
echo -e "\n3. Verifying Payment"
curl -s -X POST "$BASE_URL/payments/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "paymentId": "'"$PAYMENT_ID"'",
    "gatewayPaymentId": "'"$GATEWAY_PAYMENT_ID"'"
  }' | jq

# Test 4: Get Payment Details
echo -e "\n4. Getting Payment Details"
curl -s "$BASE_URL/payments/$PAYMENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Test 5: Get My Payments
echo -e "\n5. Getting My Payments"
curl -s "$BASE_URL/payments/my-payments" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n=== Tests Complete ==="
```

---

## 📊 Test Checklist

### Functional Tests
- [ ] Payment creation works for all gateways
- [ ] Payment verification succeeds
- [ ] Payment failure handled correctly
- [ ] Refund processing works
- [ ] Refund amount calculated correctly
- [ ] Webhooks received and processed
- [ ] Transaction IDs unique
- [ ] Payment details stored correctly

### Security Tests
- [ ] Cannot pay for others' bookings
- [ ] Cannot view others' payments
- [ ] Webhook signatures verified
- [ ] Payment amounts validated
- [ ] No sensitive data in responses
- [ ] Rate limiting works

### Edge Cases
- [ ] Duplicate payment prevention
- [ ] Already paid booking handling
- [ ] Past showtime payment rejection
- [ ] Invalid gateway handling
- [ ] Network timeout handling
- [ ] Concurrent payment attempts

### Integration Tests
- [ ] Booking status updates correctly
- [ ] Seat availability updates
- [ ] User payment history accurate
- [ ] Admin can view all payments
- [ ] Refund releases seats

---

## 🐛 Common Issues & Solutions

### Issue 1: "Payment gateway not available"
**Cause:** Gateway not configured or keys invalid
**Solution:** Check `.env` file and verify API keys

### Issue 2: Webhook signature verification failed
**Cause:** Incorrect webhook secret
**Solution:** Verify webhook secret in `.env` matches gateway dashboard

### Issue 3: Payment verification fails
**Cause:** Payment not completed on gateway
**Solution:** Check payment status in gateway dashboard

### Issue 4: Refund fails
**Cause:** Payment not in refundable state
**Solution:** Verify payment is completed and not already refunded

### Issue 5: Duplicate payments
**Cause:** Multiple simultaneous requests
**Solution:** Implement idempotency keys (already handled)

---

## 📈 Performance Testing

### Load Test Payment Creation

```bash
# Install Apache Bench
ab -n 100 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -p payment-data.json \
  http://localhost:3000/api/v1/payments/create
```

**Expected:**
- Response time < 500ms
- No errors
- All payments processed correctly

---

## ✅ Production Readiness Checklist

- [ ] All test scenarios pass
- [ ] Webhooks tested and working
- [ ] Error handling comprehensive
- [ ] Logging implemented
- [ ] Security measures in place
- [ ] Rate limiting configured
- [ ] Test cards removed from production
- [ ] Live API keys configured
- [ ] Monitoring set up
- [ ] Documentation complete

---

**Payment testing complete!** 💳✅
