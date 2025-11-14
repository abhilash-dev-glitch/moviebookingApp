# Render Deployment Guide for CineGo

This guide will help you deploy both the **Frontend** (React + Vite) and **Backend** (Node.js + Express) to Render.

---

## 📋 Prerequisites

1. **Render Account** - Sign up at [render.com](https://render.com)
2. **GitHub Account** - Repository must be public or you need to grant access
3. **External Services Ready**:
   - MongoDB Atlas (free tier available)
   - Redis Cloud (free tier available)
   - Stripe Account (for payments)
   - Twilio Account (for SMS)
   - Nodemailer configured with email service
   - RabbitMQ (or alternative message broker)

---

## 🚀 Part 1: Backend Deployment on Render

### Step 1: Prepare Backend for Render

#### 1.1 Create a Render-specific startup file (optional but recommended)

Your `server.js` already listens on `process.env.PORT`, which Render provides automatically.

#### 1.2 Ensure `node_modules` is in `.gitignore`

Check that your `.gitignore` includes:
```
node_modules/
.env
.env.local
.env.*.local
```

#### 1.3 Update Frontend URL in Backend

The backend CORS should accept your frontend Render URL. Update this in your backend environment variables.

### Step 2: Create Backend Service on Render

1. **Go to** [render.com/dashboard](https://render.com/dashboard)
2. **Click** "New +" → **Web Service**
3. **Connect your GitHub repository**
   - Select the repository containing this project
   - Authorize Render to access your GitHub account

4. **Configure the Web Service**

   | Setting | Value |
   |---------|-------|
   | **Name** | `cinego-backend` (or your preference) |
   | **Root Directory** | `backend` |
   | **Environment** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free (or Starter Pro for production) |

5. **Add Environment Variables**

   Click **Advanced** → **Add Environment Variable** and add each:

   ```
   NODE_ENV=production
   PORT=3000
   
   # Database
   MONGODB_URI=your_mongodb_atlas_connection_string
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=30d
   
   # Redis
   REDIS_HOST=your_redis_cloud_host
   REDIS_PORT=your_redis_cloud_port
   REDIS_PASSWORD=your_redis_password
   
   # RabbitMQ
   RABBITMQ_URL=your_rabbitmq_connection_string
   
   # Email Service
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_FROM=noreply@cinego.com
   
   # SMS Service (Twilio)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   
   # Razorpay
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   
   # Cloudinary
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   
   # Frontend URL
   FRONTEND_URL=https://your-frontend-url.onrender.com
   
   # Webhook URLs
   STRIPE_WEBHOOK_URL=https://your-backend-url.onrender.com/api/v1/webhooks/stripe
   RAZORPAY_WEBHOOK_URL=https://your-backend-url.onrender.com/api/v1/webhooks/razorpay
   ```

6. **Click Deploy**

   Render will automatically deploy when you push to your repository.

### Step 3: Get Backend URL

After deployment completes:
- Your backend URL will be: `https://cinego-backend.onrender.com`
- Use this URL for frontend API calls and webhook configurations

---

## 🎨 Part 2: Frontend Deployment on Render

### Step 1: Prepare Frontend for Render

#### 1.1 Create a `.env.production` file

Create `frontend/.env.production`:
```env
VITE_API_BASE=https://cinego-backend.onrender.com/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

#### 1.2 Update vite.config.js (Optional)

Your current vite.config.js already supports environment variables properly.

### Step 2: Create Frontend Service on Render

1. **Go to** [render.com/dashboard](https://render.com/dashboard)
2. **Click** "New +" → **Static Site** (or **Web Service** for more control)

#### Option A: Static Site (Simpler, Recommended)

1. **Name**: `cinego-frontend`
2. **Repository**: Select your GitHub repo
3. **Branch**: `master` (or your main branch)
4. **Root Directory**: `frontend`
5. **Build Command**: `npm install && npm run build`
6. **Publish Directory**: `dist`
7. **Click Deploy**

#### Option B: Web Service (More Control)

If you need routing for SPA:

1. **Name**: `cinego-frontend`
2. **Root Directory**: `frontend`
3. **Environment**: `Node`
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm run preview`
6. **Add Environment Variables**:
   ```
   VITE_API_BASE=https://cinego-backend.onrender.com/api/v1
   VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
   ```

### Step 3: Configure Custom Domain (Optional)

1. In Render dashboard, go to your service settings
2. Click **Settings** → **Custom Domains**
3. Add your domain (requires DNS configuration)

---

## 🔗 Part 3: Connect Frontend and Backend

### Step 1: Update Backend CORS

After frontend deploys, update backend environment variable:
```
FRONTEND_URL=https://cinego-frontend.onrender.com
```

### Step 2: Update Frontend API Base

Update `frontend/.env.production`:
```env
VITE_API_BASE=https://cinego-backend.onrender.com/api/v1
```

---

## 🔄 Part 4: Database & External Services Setup

### MongoDB Atlas (Free Tier)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free cluster
3. Create database user and whitelist all IPs (0.0.0.0/0)
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
5. Add to backend environment variables as `MONGODB_URI`

### Redis Cloud

1. Go to [redis.com/try-free](https://redis.com/try-free)
2. Create a free Redis database
3. Get connection details (host, port, password)
4. Add to backend environment variables

### Stripe Webhooks

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://cinego-backend.onrender.com/api/v1/webhooks/stripe`
3. Select events: `charge.succeeded`, `charge.failed`, `payment_intent.*`
4. Copy webhook signing secret to backend env as `STRIPE_WEBHOOK_SECRET`

---

## 📝 Part 5: Deployment Checklist

### Backend
- [ ] MongoDB Atlas connection string set
- [ ] JWT secret configured
- [ ] Redis credentials set
- [ ] RabbitMQ connection string set
- [ ] SMTP settings configured
- [ ] Twilio credentials set
- [ ] Stripe/Razorpay credentials set
- [ ] Cloudinary credentials set
- [ ] Frontend URL configured in CORS
- [ ] Webhook URLs configured in Stripe/Razorpay dashboards
- [ ] Backend successfully deployed

### Frontend
- [ ] API base URL points to backend URL
- [ ] Stripe public key configured
- [ ] Environment file created
- [ ] npm run build succeeds locally
- [ ] Frontend successfully deployed

---

## 🧪 Part 6: Testing After Deployment

### Backend Health Check

```bash
curl https://cinego-backend.onrender.com/api/v1/health
```

### Frontend Access

1. Open `https://cinego-frontend.onrender.com` in browser
2. Check browser console for API connection errors
3. Test authentication flow

### Test Booking Flow

1. Register a new user
2. Browse movies
3. Select a showtime
4. Complete payment (use Stripe test cards)
5. Verify confirmation email

---

## 🐛 Troubleshooting

### Backend Won't Deploy

1. **Check Logs**: Render dashboard → Service → Logs
2. **Verify `package.json`**: Ensure `"main": "server.js"`
3. **Check Environment Variables**: Ensure all required vars are set
4. **Test Locally**: Run `npm start` locally first

### Frontend Shows Blank Page

1. **Check Console Errors**: Open browser DevTools → Console
2. **Check Network Tab**: Verify API calls to backend
3. **Verify Build**: Run `npm run build` locally
4. **Clear Cache**: Render clears cache on redeploy

### API Connection Issues

1. **CORS Error**: Backend `FRONTEND_URL` must match frontend URL exactly
2. **Wrong API Base**: Update `VITE_API_BASE` in frontend `.env.production`
3. **Backend Not Running**: Check backend service status in Render

### Redis/Database Connection Errors

1. **Check IP Whitelist**: MongoDB/Redis must allow Render's IPs
2. **Verify Connection String**: Copy exact string from service provider
3. **Test Locally**: Connect from your computer using same string

---

## 📚 Useful Commands

### Monitor Backend Logs

```bash
# Render logs are in dashboard, but you can also connect via SSH
# Check Render dashboard for SSH connection details
```

### Redeploy Services

1. **Automatic**: Push to GitHub branch (configured in Render)
2. **Manual**: Click "Manual Deploy" in Render dashboard

### View Environment Variables

```bash
# In Render dashboard: Service → Settings → Environment
```

---

## 🎯 Next Steps

1. **Set up monitoring**: Render dashboard has built-in metrics
2. **Configure email alerts**: Render → Settings → Notifications
3. **Set up SSL certificate**: Automatic with Render
4. **Monitor costs**: Check Render usage dashboard
5. **Schedule maintenance**: Update services regularly

---

## ⚠️ Important Notes

- **Free Tier**: Services auto-spin down after 15 minutes of inactivity
- **Production**: Upgrade to Starter Pro for always-on services ($7/month)
- **Webhooks**: Must be publicly accessible (use Render URLs)
- **Database**: Keep MongoDB Atlas free tier for development only
- **Backups**: Set up regular MongoDB backups in production

---

**Need Help?** Check Render's [documentation](https://docs.render.com) or GitHub for solutions.
