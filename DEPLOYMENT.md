# Deployment Guide

## Current Architecture
- Frontend: React SPA
- Backend: Cloudflare Worker (Hono framework)
- Database: In-memory (resets on deployment)

## Deploy to Cloudflare Workers (Recommended)

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Deploy:**
   ```bash
   npm run build
   wrangler deploy
   ```

## Database Considerations

⚠️ **Current database is in-memory and will reset on every deployment!**

### For Production, choose one:

1. **Cloudflare D1 (SQLite)** - Best for Cloudflare Workers
2. **External MongoDB** - Requires connection string
3. **Persistent storage solution**

## Environment Variables

Set these in Cloudflare Dashboard:
- `MOCHA_USERS_SERVICE_API_URL`
- `MOCHA_USERS_SERVICE_API_KEY`
- `MONGODB_CONNECTION_STRING` (if using external MongoDB)
