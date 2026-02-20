# 🌍 Environment Setup Guide

## Overview

The CutQ backend now supports automated environment loading based on the script being run. No more manual environment file switching!

## Environment Files

The system uses three environment files:

- **`.env.dev.local`** - Development environment
- **`.env.uat.local`** - UAT/Staging environment  
- **`.env.prod.local`** - Production environment

## Automated Environment Loading

### Development Scripts

```bash
# Development environment (uses .env.dev.local)
npm run dev                    # Start development server
npm run test                   # Run tests
npm run db:studio             # Open Prisma Studio
npm run db:migrate:dev        # Run database migrations
```

### UAT Scripts

```bash
# UAT environment (uses .env.uat.local)
npm run dev:uat               # Start development server with UAT config
npm run db:studio:uat         # Open Prisma Studio for UAT
npm run db:migrate:uat        # Run database migrations for UAT
npm run db:push:uat           # Push schema changes to UAT
```

### Production Scripts

```bash
# Production environment (uses .env.prod.local)
npm run start                 # Start production server
npm run start:prod            # Start production server (explicit)
npm run db:deploy:prod        # Deploy migrations to production
npm run db:studio:prod        # Open Prisma Studio for production
```

## Build and Deployment

### Building the Application

```bash
npm run build                 # Build TypeScript to dist/
```

### PM2 Deployment

```bash
# Production deployment
npm run pm2:start             # Start with PM2 (production)
npm run pm2:restart           # Restart production instance
npm run pm2:logs              # View production logs
npm run pm2:status            # Check PM2 status

# UAT deployment
npm run pm2:start:uat         # Start UAT instance with PM2
npm run pm2:restart:uat       # Restart UAT instance
npm run pm2:logs:uat          # View UAT logs

# PM2 Management
npm run pm2:stop              # Stop production instance
npm run pm2:delete            # Delete production instance
npm run pm2:monit             # Open PM2 monitoring dashboard
```

## Environment Variables

Each environment file should contain:

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Server
NODE_ENV=development|production
PORT=5000
HOST=localhost

# JWT
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret

# CORS
CORS_ORIGIN=http://localhost:3000

# Custom Environment Identifier
CUST_NODE_ENV=dev|uat|prod
```

### Environment-Specific Configurations

#### Development (.env.dev.local)
- Local database connection
- Debug logging enabled
- Relaxed CORS settings
- Development JWT secrets

#### UAT (.env.uat.local)
- UAT database connection
- Staging URLs
- UAT-specific credentials
- Testing configurations

#### Production (.env.prod.local)
- Production database connection
- Production URLs
- Strong JWT secrets
- Production-grade security settings

## Database Management

### Development Database

```bash
npm run db:migrate:dev        # Create and apply migrations
npm run db:push               # Push schema changes
npm run db:seed               # Seed development data
npm run db:reset              # Reset development database
```

### UAT Database

```bash
npm run db:migrate:uat        # Apply migrations to UAT
npm run db:push:uat           # Push schema changes to UAT
npm run db:seed:uat           # Seed UAT data
npm run db:reset:uat          # Reset UAT database
```

### Production Database

```bash
npm run db:deploy:prod        # Deploy migrations to production
npm run db:push:prod          # Push schema changes to production
npm run db:seed:prod          # Seed production data (use carefully!)
```

## Troubleshooting

### Environment Not Loading

1. Check if the environment file exists:
   ```bash
   ls -la .env.*.local
   ```

2. Verify environment file syntax:
   ```bash
   cat .env.dev.local
   ```

3. Check for syntax errors in environment files

### Database Connection Issues

1. Verify DATABASE_URL in the environment file
2. Check database server is running
3. Verify database credentials and permissions

### PM2 Issues

1. Check PM2 status:
   ```bash
   npm run pm2:status
   ```

2. View logs:
   ```bash
   npm run pm2:logs
   ```

3. Restart if needed:
   ```bash
   npm run pm2:restart
   ```

## Best Practices

1. **Never commit environment files** - They contain sensitive data
2. **Use strong secrets in production** - Generate random, long secrets
3. **Backup production environment files** - Store securely
4. **Test UAT before production** - Always test changes in UAT first
5. **Monitor PM2 processes** - Use `npm run pm2:monit` for monitoring

## Migration from Old System

If you were using a single `.env` file:

1. Copy your `.env` to `.env.dev.local`
2. Create `.env.uat.local` and `.env.prod.local` with appropriate values
3. Update database URLs for each environment
4. Update secrets and URLs for each environment
5. Test each environment separately
