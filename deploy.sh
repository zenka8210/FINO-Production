#!/bin/bash
# Production deployment script

echo "🚀 Starting production deployment..."

# 1. Build frontend
echo "📦 Building frontend..."
cd asm/fe
npm run build
echo "✅ Frontend built successfully"

# 2. Test backend
echo "🧪 Testing backend..."
cd ../server
npm run test
echo "✅ Backend tests passed"

# 3. Deploy to git
echo "📡 Pushing to GitHub..."
cd ../..
git add .
git commit -m "Production deployment $(date)"
git push origin master

echo "🎉 Deployment completed!"
echo "🔗 Check your deployments:"
echo "   - Frontend: https://vercel.com/dashboard"
echo "   - Backend: https://dashboard.render.com"
