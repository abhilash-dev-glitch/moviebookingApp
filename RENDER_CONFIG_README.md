# Render Deployment Configuration

This folder contains configuration files for deploying to Render.

## Files in this directory:

- `.env.example` - Template for backend environment variables
- `.env.production` - Frontend production environment variables
- `RENDER_DEPLOYMENT.md` - Complete deployment guide

## Quick Start:

1. Read `RENDER_DEPLOYMENT.md` for detailed instructions
2. Use `.env.example` as reference for backend environment variables
3. Update `.env.production` with your actual service URLs

## What to do before deploying:

1. Ensure your GitHub repository is up to date
2. Add Render to your GitHub authorized apps
3. Set up external services (MongoDB, Redis, etc.)
4. Configure all environment variables
5. Test locally with `npm start` in backend and `npm run dev` in frontend
