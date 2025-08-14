# Production Health Check Endpoints

# Backend Health Check
GET https://your-backend.onrender.com/api/health

# Database Connection Check  
GET https://your-backend.onrender.com/api/db-status

# Frontend Build Check
GET https://your-frontend.vercel.app/api/health

---

# Monitoring Dashboard URLs

## Performance Monitoring
- **Vercel Analytics**: https://vercel.com/analytics
- **Render Metrics**: https://dashboard.render.com/your-service/metrics
- **MongoDB Metrics**: https://cloud.mongodb.com/metrics

## Error Tracking  
- **Vercel Functions**: https://vercel.com/functions
- **Render Logs**: https://dashboard.render.com/your-service/logs
- **Application Logs**: https://dashboard.render.com/your-service/shell

## Custom Monitoring Commands
```bash
# Check API response time
curl -w "%{time_total}s" https://your-backend.onrender.com/api/products

# Check database connection
curl https://your-backend.onrender.com/debug/db-status

# Monitor error rates
tail -f /var/log/app.log | grep ERROR
```

## Automated Health Checks
- **Uptime Robot**: https://uptimerobot.com
- **StatusCake**: https://statuscake.com  
- **Pingdom**: https://pingdom.com

## Performance Benchmarks
- **Frontend**: < 3s First Contentful Paint
- **API Endpoints**: < 500ms response time
- **Database Queries**: < 100ms average
- **Uptime Target**: 99.9%
