# Shared Expenses - Vercel Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account** (Free tier works fine)
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

2. **Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

## Project Structure

```
vercel-app/
├── api/                    # Backend API (Python serverless functions)
│   ├── index.py           # Health check
│   ├── users/
│   │   ├── index.py       # GET /api/users
│   │   └── init.py        # POST /api/users/init
│   └── items/
│       ├── index.py       # GET/POST /api/items
│       ├── [id].py        # GET/PUT/DELETE /api/items/:id
│       └── [id]/
│           ├── toggle-divided.py
│           └── move-to-expense.py
├── frontend/               # Expo web app
├── vercel.json            # Vercel configuration
├── package.json           # Root package.json
└── requirements.txt       # Python dependencies
```

## Deployment Steps

### Step 1: Set up MongoDB Atlas

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a FREE cluster
3. Create a database user (remember username/password)
4. Add `0.0.0.0/0` to Network Access (allows all IPs)
5. Get connection string from "Connect" → "Connect your application"
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### Step 2: Deploy to Vercel

**Option A: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to vercel-app folder
cd vercel-app

# Deploy
vercel

# Set environment variable
vercel env add MONGO_URL
# Paste your MongoDB connection string when prompted

# Deploy to production
vercel --prod
```

**Option B: Via GitHub + Vercel Dashboard**
1. Push the `vercel-app` folder to a GitHub repository
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Add Environment Variable:
   - Name: `MONGO_URL`
   - Value: Your MongoDB Atlas connection string
5. Click "Deploy"

### Step 3: Access Your App

After deployment, Vercel will give you a URL like:
`https://your-app-name.vercel.app`

Open it in your browser and enjoy! 🎉

## Troubleshooting

### "Cannot connect to database"
- Make sure your MongoDB Atlas Network Access allows `0.0.0.0/0`
- Verify the connection string is correct
- Check that the MONGO_URL environment variable is set in Vercel

### "API not working"
- Check Vercel Function logs in the dashboard
- Make sure `requirements.txt` includes `pymongo`

### "Frontend not loading"
- Clear browser cache
- Check browser console for errors

## Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
cd vercel-app
vercel dev

# This will run both API and frontend locally
```

## Cost

- **MongoDB Atlas**: Free tier (512MB storage)
- **Vercel**: Free tier (100GB bandwidth/month)

Total cost: **$0/month** for personal use! 🎉
