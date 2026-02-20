# 🚀 CutQ Backend Deployment Guide

## Quick Start

### Development
```bash
npm run dev                    # Start development server
npm run env:test              # Test development environment
```

### UAT/Staging
```bash
npm run dev:uat               # Start UAT development server
npm run env:test:uat          # Test UAT environment
```

### Production
```bash
npm run build                 # Build the application
npm run start                 # Start production server
npm run pm2:start             # Start with PM2 (recommended)
npm run env:test:prod         # Test production environment
```

## Environment Files

| Environment | File | Purpose |
|-------------|------|---------|
| Development | `.env.dev.local` | Local development |
| UAT/Staging | `.env.uat.local` | Testing environment |
| Production | `.env.prod.local` | Production deployment |

## Available Scripts

### Development Scripts
```bash
npm run dev                   # Development server (uses .env.dev.local)
npm run dev:uat              # UAT development server (uses .env.uat.local)
npm run dev:prod             # Production development server (uses .env.prod.local)
```

### Production Scripts
```bash
npm run build                # Build TypeScript to dist/
npm run start                # Start production server (uses .env.prod.local)
npm run start:dev            # Start built app with dev config
npm run start:uat            # Start built app with UAT config
npm run start:prod           # Start built app with prod config
```

### Database Scripts
```bash
# Development
npm run db:migrate:dev       # Run migrations (dev)
npm run db:push              # Push schema changes (dev)
npm run db:studio            # Open Prisma Studio (dev)
npm run db:seed              # Seed database (dev)

# UAT
npm run db:migrate:uat       # Run migrations (UAT)
npm run db:push:uat          # Push schema changes (UAT)
npm run db:studio:uat        # Open Prisma Studio (UAT)
npm run db:seed:uat          # Seed database (UAT)

# Production
npm run db:deploy:prod       # Deploy migrations (prod)
npm run db:push:prod         # Push schema changes (prod)
npm run db:studio:prod       # Open Prisma Studio (prod)
npm run db:seed:prod         # Seed database (prod)
```

### PM2 Scripts
```bash
# Start
npm run pm2:start            # Start production with PM2
npm run pm2:start:uat        # Start UAT with PM2
npm run pm2:start:dev        # Start development with PM2

# Control
npm run pm2:restart          # Restart production
npm run pm2:reload           # Reload production (zero-downtime)
npm run pm2:stop             # Stop production
npm run pm2:delete           # Delete production instance

# Monitoring
npm run pm2:logs             # View production logs
npm run pm2:status           # Check PM2 status
npm run pm2:monit            # Open PM2 monitoring dashboard
```

### Testing Scripts
```bash
npm run env:test             # Test dev environment
npm run env:test:uat         # Test UAT environment
npm run env:test:prod        # Test prod environment
npm run env:test:all         # Test all environments
```

## Deployment Workflow

### 1. Development
```bash
# Start development
npm run dev

# Test environment
npm run env:test

# Run tests
npm run test
```

### 2. UAT Deployment
```bash
# Test UAT environment
npm run env:test:uat

# Build application
npm run build

# Start UAT server
npm run start:uat
# OR with PM2
npm run pm2:start:uat
```

### 3. Production Deployment
```bash
# Test production environment
npm run env:test:prod

# Build application
npm run build

# Deploy database migrations
npm run db:deploy:prod

# Start production server with PM2
npm run pm2:start

# Monitor
npm run pm2:status
npm run pm2:logs
```

## Environment Configuration

### Required Environment Variables

Each `.env.*.local` file must contain:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Server
NODE_ENV=development|production
PORT=5000
CUST_NODE_ENV=dev|uat|prod

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars

# CORS
CORS_ORIGIN=http://localhost:3000|https://yourdomain.com

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password

# SMS
FAST2SMS_API_KEY=your-api-key
```

## PM2 Configuration

The `ecosystem.config.js` file contains PM2 configurations for:

- **Production**: Cluster mode with all CPU cores
- **UAT**: Single instance for testing
- **Logging**: Separate log files for each environment
- **Auto-restart**: Automatic restart on crashes
- **Memory limits**: Restart on memory threshold

## Monitoring

### PM2 Monitoring
```bash
npm run pm2:monit            # Real-time monitoring
npm run pm2:logs             # View logs
npm run pm2:status           # Process status
```

### Log Files
- Production: `./logs/pm2-combined.log`
- UAT: `./logs/pm2-uat-combined.log`
- Application: `./logs/info.log`, `./logs/error.log`

## Troubleshooting

### Environment Issues
1. Run `npm run env:test:all` to validate all environments
2. Check environment file syntax
3. Verify database connections

### Database Issues
1. Check database server status
2. Verify connection strings
3. Run migrations: `npm run db:deploy:prod`

### PM2 Issues
1. Check status: `npm run pm2:status`
2. View logs: `npm run pm2:logs`
3. Restart: `npm run pm2:restart`

## Security Notes

1. **Never commit `.env.*.local` files**
2. **Use strong secrets** (minimum 32 characters)
3. **Backup environment files** securely
4. **Use HTTPS** in production
5. **Monitor logs** for security issues

## Best Practices

1. **Test in UAT** before production deployment
2. **Use PM2** for production deployments
3. **Monitor resources** with `pm2 monit`
4. **Backup databases** before migrations
5. **Use environment-specific** database instances
