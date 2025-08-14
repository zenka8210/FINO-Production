# Production Deployment Guide

## 📋 Pre-deployment Checklist

- [ ] MongoDB Atlas database setup
- [ ] Environment variables configured
- [ ] CORS origins updated
- [ ] Google Cloud Storage setup
- [ ] Payment gateway credentials ready
- [ ] Email service configured

## 🎯 Quick Deployment Steps

### Backend (Render)
1. Connect GitHub repository
2. Create Web Service: `asm/server`
3. Set environment variables
4. Deploy

### Frontend (Vercel)  
1. Import GitHub repository
2. Configure build settings: `asm/fe`
3. Set environment variables
4. Deploy

## 🔗 Important URLs

- **Backend**: https://your-backend.onrender.com
- **Frontend**: https://your-project.vercel.app
- **Database**: MongoDB Atlas Dashboard
- **Render**: https://dashboard.render.com
- **Vercel**: https://vercel.com/dashboard

## ⚙️ Environment Variables

### Backend (Render)
```
DB_URI=mongodb+srv://...
JWT_SECRET=your-secret
FRONTEND_URL=https://your-frontend.vercel.app
VNPAY_TMN_CODE=your-code
VNPAY_SECRET_KEY=your-key
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
```

## 🚨 Troubleshooting

### Common Issues:
1. **CORS Error**: Update FRONTEND_URL in Render
2. **API Connection**: Check NEXT_PUBLIC_API_URL
3. **Database Connection**: Verify MongoDB Atlas IP whitelist
4. **Build Failed**: Check Node.js version compatibility

### Debug Commands:
```bash
# Check build logs
vercel logs your-deployment-url

# Check backend logs  
render logs your-service-name

# Test API endpoints
curl https://your-backend.onrender.com/api/auth/test
```
