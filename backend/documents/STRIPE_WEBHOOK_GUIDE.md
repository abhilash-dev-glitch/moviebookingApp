# Stripe Webhook Setup Guide for Local Development

This guide explains how to set up and test Stripe webhooks in your local development environment.

## Prerequisites

1. Stripe Account
2. Node.js and npm installed
3. Stripe CLI installed (recommended)

## Option 1: Using Stripe CLI (Recommended)

### 1. Install Stripe CLI

#### Windows:
1. Download from: https://github.com/stripe/stripe-cli/releases/latest
2. Extract `stripe.exe` to a permanent location (e.g., `C:\Users\YourUsername\stripe\`)
3. Add to PATH (optional but recommended)

#### Verify Installation:
```bash
stripe --version
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Start Forwarding Webhooks

In a new terminal, run:
```bash
stripe listen --forward-to http://localhost:5000/api/v1/webhooks/stripe
```

### 4. Get Webhook Secret

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxx
```

### 5. Update .env File

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### 6. Test Webhooks

In a new terminal:
```bash
stripe trigger payment_intent.succeeded
```

## Option 2: Using ngrok (Alternative)

### 1. Install ngrok
Download from: https://ngrok.com/download

### 2. Start ngrok
```bash
ngrok http 5000
```

### 3. Configure Stripe Dashboard
1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint:
   - URL: `https://YOUR_NGROK_URL.ngrok.io/api/v1/webhooks/stripe`
   - Select events to listen to
3. Copy the webhook signing secret

### 4. Update .env
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Testing Webhooks

### Test Events
```bash
# Stripe CLI
stripe trigger payment_intent.succeeded

# Or create test data
stripe fixtures fixture.json
```

### Verify Webhook Signatures
Your backend should verify webhook signatures using the webhook secret.

## Troubleshooting

### Common Issues
1. **Webhook not received**
   - Check if Stripe CLI is running
   - Verify the endpoint URL matches exactly
   - Check for typos in the webhook secret

2. **Invalid signature**
   - Ensure webhook secret is correctly set in `.env`
   - Restart your server after changing environment variables

3. **Connection refused**
   - Make sure your local server is running
   - Verify the port matches (default: 5000)

## Security Notes

- Never commit your webhook secret to version control
- Use environment variables for all secrets
- Verify webhook signatures in production
- Rotate webhook secrets periodically

## Resources

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
