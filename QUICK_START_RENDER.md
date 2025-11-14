# CineGo Render Deployment - Quick Reference

## 🚀 30-Second Summary

Deploy both backend and frontend to Render in 3 steps:

### 1. **Create Backend Service**
- Go to render.com → New Web Service
- Connect GitHub repo
- Root Directory: `backend`
- Build: `npm install`
- Start: `npm start`
- Add all environment variables from `.env.example`

### 2. **Create Frontend Service**
- Go to render.com → New Static Site (or Web Service)
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`

### 3. **Connect Them**
- Update backend `FRONTEND_URL` env var with frontend URL
- Update frontend `.env.production` API base with backend URL
- Redeploy both services

---

## 📋 Environment Variables Needed

### Backend (Must Set These)
```
MONGODB_URI=         # MongoDB Atlas connection string
JWT_SECRET=          # Your secret key
REDIS_HOST=          # Redis Cloud host
REDIS_PORT=          # Redis Cloud port
REDIS_PASSWORD=      # Redis Cloud password
FRONTEND_URL=        # Your frontend Render URL
STRIPE_SECRET_KEY=   # Stripe test/live secret
```

### Frontend (Update these)
```
VITE_API_BASE=https://cinego-backend.onrender.com/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
```

---

## 🔗 Service URLs (Examples)
```
Backend:  https://cinego-backend.onrender.com
Frontend: https://cinego-frontend.onrender.com
```

---

## 📚 Full Documentation

See `RENDER_DEPLOYMENT.md` for detailed step-by-step instructions with:
- Database setup (MongoDB Atlas)
- Caching setup (Redis Cloud)
- Payment configuration (Stripe webhooks)
- Troubleshooting guide
- Testing procedures

---

## ✅ Deployment Checklist

Before deploying:
- [ ] GitHub repository is public or Render has access
- [ ] All dependencies in package.json
- [ ] `.env.example` has all required variables
- [ ] No secrets committed to git
- [ ] Local testing passed (`npm start` backend, `npm run dev` frontend)

After deploying:
- [ ] Backend service running (check logs)
- [ ] Frontend service deployed
- [ ] Frontend can reach backend API
- [ ] Test a complete booking flow
- [ ] Check email notifications working
- [ ] Payment webhooks configured

---

## 🔑 Get External Service Credentials

1. **MongoDB Atlas**: mongodb.com/atlas → Free Cluster
2. **Redis Cloud**: redis.com/try-free → Free DB
3. **Stripe**: stripe.com → Developers → API Keys
4. **Twilio**: twilio.com → Account → Auth Token
5. **Gmail SMTP**: accounts.google.com → App Passwords

---

## 💬 Common Commands

```bash
# Test backend locally
cd backend && npm start

# Test frontend locally
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build

# Check environment variables on Render
# Dashboard → Service → Settings → Environment
```

---

**Need Help?** Check the detailed guide in `RENDER_DEPLOYMENT.md`
