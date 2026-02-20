# 🚀 Deployment Guide

## 📋 Table of Contents
- [Deployment Overview](#deployment-overview)
- [Environment Setup](#environment-setup)
- [Database Deployment](#database-deployment)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Production Configuration](#production-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)

## 🌐 Deployment Overview

### Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Database   │
│   (Vercel)  │◄──►│  (Railway)  │◄──►│(PostgreSQL)│
│             │    │             │    │             │
│ React Build │    │ Express API │    │ Prisma ORM │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Deployment Platforms
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: Railway, Heroku, or AWS EC2
- **Database**: Railway PostgreSQL, AWS RDS, or Supabase
- **File Storage**: AWS S3 or Cloudinary
- **CDN**: CloudFront or Cloudflare

## 🔧 Environment Setup

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

# Server Configuration
PORT=3002
NODE_ENV="production"
CORS_ORIGIN=["https://your-frontend-domain.com"]

# Social Authentication
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# SMS Configuration
FAST2SMS_API_KEY="your-fast2sms-api-key"

# File Upload
UPLOAD_PATH="/uploads"
MAX_FILE_SIZE="10485760"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
```

#### Frontend (.env)
```bash
# API Configuration
VITE_API_URL="https://your-backend-domain.com/api/v1"

# Social Authentication
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
VITE_FACEBOOK_APP_ID="your-facebook-app-id"

# Environment
VITE_NODE_ENV="production"

# Analytics (optional)
VITE_GA_TRACKING_ID="your-google-analytics-id"
```

## 🗄️ Database Deployment

### Railway PostgreSQL Setup
1. **Create Railway Account**: Sign up at railway.app
2. **Create New Project**: Click "New Project" → "Provision PostgreSQL"
3. **Get Connection String**: Copy the DATABASE_URL from settings
4. **Configure Environment**: Add DATABASE_URL to backend environment

### Database Migration
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy

# Seed production data
railway run npm run db:seed:production
```

### Manual Database Setup (AWS RDS)
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier cutq-production \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username cutqadmin \
  --master-user-password your-secure-password \
  --allocated-storage 20

# Get connection details
aws rds describe-db-instances --db-instance-identifier cutq-production
```

## 🔧 Backend Deployment

### Railway Deployment
1. **Connect Repository**: Link your GitHub repository
2. **Configure Build**: Railway auto-detects Node.js
3. **Set Environment Variables**: Add all required env vars
4. **Deploy**: Push to main branch triggers deployment

### Manual Railway Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Set environment variables
railway variables set DATABASE_URL="your-database-url"
railway variables set JWT_SECRET="your-jwt-secret"
# ... set all other variables

# Deploy
railway up
```

### Heroku Deployment
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create cutq-backend

# Set environment variables
heroku config:set DATABASE_URL="your-database-url"
heroku config:set JWT_SECRET="your-jwt-secret"
# ... set all other variables

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 3002

# Start application
CMD ["npm", "start"]
```

```bash
# Build and deploy
docker build -t cutq-backend .
docker run -p 3002:3002 --env-file .env cutq-backend
```

## 🎨 Frontend Deployment

### Vercel Deployment
1. **Connect Repository**: Import from GitHub
2. **Configure Build**: Vercel auto-detects Vite
3. **Set Environment Variables**: Add VITE_* variables
4. **Deploy**: Automatic deployment on push

### Manual Vercel Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel

# Set environment variables
vercel env add VITE_API_URL production
vercel env add VITE_GOOGLE_CLIENT_ID production
# ... add all VITE_* variables

# Redeploy with new env vars
vercel --prod
```

### Netlify Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify init

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### AWS S3 + CloudFront
```bash
# Build application
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## ⚙️ Production Configuration

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/cutq
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    location / {
        root /var/www/cutq/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads/ {
        root /var/www/cutq/backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### PM2 Process Management
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cutq-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Backend health check
curl https://your-backend-domain.com/health

# Database health check
curl https://your-backend-domain.com/api/v1/health/db
```

### Logging Setup
```javascript
// Production logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### Backup Strategy
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backups/cutq_backup_$DATE.sql

# Upload to S3
aws s3 cp backups/cutq_backup_$DATE.sql s3://your-backup-bucket/

# Cleanup old backups (keep last 30 days)
find backups/ -name "*.sql" -mtime +30 -delete
```

### Performance Monitoring
```bash
# Install monitoring tools
npm install -g clinic

# Performance profiling
clinic doctor -- node dist/index.js
clinic bubbleprof -- node dist/index.js
clinic flame -- node dist/index.js
```

### Security Checklist
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Security headers configured
- [ ] Regular security updates
- [ ] Backup and recovery tested
- [ ] Monitoring and alerting setup

### Maintenance Tasks
```bash
# Weekly maintenance script
#!/bin/bash

# Update dependencies
npm audit fix

# Clean up old logs
find logs/ -name "*.log" -mtime +7 -delete

# Database maintenance
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Restart services
pm2 restart all
```
