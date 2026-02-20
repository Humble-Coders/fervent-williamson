# Production Logging System - CutQ Backend

## Overview

CutQ backend uses **Winston with Daily Rotate File** for production-grade logging with automatic rotation, compression, and cleanup. This system enables tracking customer bugs, monitoring errors, and debugging production issues efficiently.

---

## Features

✅ **Automatic Daily Rotation** - Logs rotate daily at midnight  
✅ **Size-Based Rotation** - Logs rotate when they reach 20MB  
✅ **Automatic Compression** - Old logs are gzipped to save ~75% disk space  
✅ **Automatic Cleanup** - Old logs deleted based on retention policy  
✅ **User Tracking** - Every error includes userId, userEmail, userRole  
✅ **Request Tracing** - Unique request IDs for tracing across logs  
✅ **Full Context** - Request URL, method, body, query, params included  
✅ **Module Filtering** - Enable/disable logging for specific modules  
✅ **PM2 Log Rotation** - Server logs also managed  

---

## Implementation Details

### Files Modified

1. **`src/config/logger.ts`** - Main logger (Winston with DailyRotateFile)
   - Replaced manual file rotation with Winston transports
   - Added automatic rotation, compression, and cleanup
   - Maintained all existing features (module filtering, specialized loggers)

2. **`src/middleware/errorHandler.ts`** - Enhanced error logging
   - Added user identification (userId, userEmail, userRole)
   - Added full request context (query, params, body)
   - Added request body sanitization (passwords redacted)

3. **`src/app.ts`** - Request ID middleware
   - Generates unique request IDs for tracing
   - Request IDs included in all log entries

### Log Retention Policies

| Log Type | Retention | Max Size | Compression | Purpose |
|----------|-----------|----------|-------------|---------|
| **Error** | 30 days | 20MB | ✅ Yes | Critical errors |
| **Warn** | 14 days | 20MB | ✅ Yes | Warnings |
| **Info** | 7 days | 20MB | ✅ Yes | General info |
| **Debug** | 3 days | 20MB | ✅ Yes | Debug info |
| **Audit** | 90 days | 20MB | ✅ Yes | Compliance - admin actions |
| **Security** | 90 days | 20MB | ✅ Yes | Compliance - security events |
| **Performance** | 7 days | 20MB | ✅ Yes | Slow queries/requests |
| **Combined** | 14 days | 50MB | ✅ Yes | All logs in one file |

**Total Disk Space:** ~1.4GB compressed (vs ~5GB uncompressed)

---

## Log Files Location

### On Linux Production Server

```
/path/to/api-backend-nodejs/logs/
├── error-2025-01-11.log          # Today's errors
├── warn-2025-01-11.log           # Today's warnings
├── info-2025-01-11.log           # Today's info logs
├── debug-2025-01-11.log          # Today's debug logs
├── audit-2025-01-11.log          # Today's audit logs
├── security-2025-01-11.log       # Today's security logs
├── performance-2025-01-11.log    # Today's performance logs
├── combined-2025-01-11.log       # All logs combined
├── error-2025-01-10.log.gz       # Compressed old logs
├── pm2-error.log                 # PM2 error output
├── pm2-out.log                   # PM2 standard output
└── pm2-combined.log              # PM2 combined logs
```

**Important:** Logs are created at **project root** (`process.cwd()`), NOT in the `dist/` folder.

---

## Log Format

Each error log entry includes:

```json
{
  "timestamp": "2025-01-11 14:30:45",
  "level": "error",
  "message": "Error message",
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE",
    "statusCode": 500,
    "stack": "Error stack trace...",
    "details": {}
  },
  "request": {
    "id": "1736598645123-abc123",
    "url": "/api/bookings",
    "method": "POST",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "userId": "user-123",
    "userEmail": "customer@example.com",
    "userRole": "CUSTOMER",
    "query": {},
    "params": {},
    "body": { "serviceId": "123" },
    "timestamp": "2025-01-11T14:30:45.123Z"
  },
  "environment": {
    "nodeEnv": "production",
    "nodeVersion": "v18.17.0",
    "platform": "linux"
  }
}
```

---

## Setup Instructions

### 1. First-Time Setup (Run Once on Production Server)

```bash
cd /path/to/api-backend-nodejs

# Make scripts executable
chmod +x scripts/*.sh

# Setup PM2 log rotation
./scripts/logging/setup-pm2-logrotate.sh

# Install jq for log analysis
# macOS:
brew install jq

# Ubuntu/Debian:
sudo apt-get install jq

# CentOS/RHEL:
sudo yum install jq
```

### 2. Deploy to Production

```bash
# From your local machine
./deploy-prod.sh
```

---

## Finding Errors in Production

### When Customer Reports a Bug

**Scenario:** Customer "john@example.com" reports booking failed

```bash
cd /path/to/api-backend-nodejs

# Find all errors for this customer
./scripts/logging/find-user-errors.sh john@example.com

# Or by userId
./scripts/logging/find-user-errors.sh user-123

# View full error details with jq
cat logs/error-$(date +%Y-%m-%d).log | jq 'select(.request.userEmail == "john@example.com")'
```

**You'll see:**
- ✅ Exact error message and stack trace
- ✅ Which endpoint failed: `/api/bookings`
- ✅ What data was sent: `{ "serviceId": "123", "date": "2025-01-12" }`
- ✅ User info: userId, email, role
- ✅ When it happened: timestamp
- ✅ Request ID for tracing

### Find Errors by Date

```bash
# Analyze errors for a specific date
./scripts/logging/find-errors-by-date.sh 2025-01-11

# Shows:
# - Total errors for that date
# - Breakdown by error type
# - Top users with errors
# - Affected endpoints
```

### Get Error Summary

```bash
# Last 7 days (default)
./scripts/logging/error-summary.sh

# Last 30 days
./scripts/logging/error-summary.sh 30

# Shows:
# - Total errors
# - Top error types
# - Most affected endpoints
# - Users with most errors
```

### Manual Log Analysis with jq

```bash
# View today's errors (formatted)
cat logs/error-$(date +%Y-%m-%d).log | jq .

# Find specific error code
cat logs/error-*.log | jq 'select(.error.code == "VALIDATION_ERROR")'

# Find errors for specific endpoint
cat logs/error-*.log | jq 'select(.request.url | contains("/api/bookings"))'

# Count errors by user
cat logs/error-*.log | jq -r '.request.userId' | sort | uniq -c | sort -rn

# Find errors in last hour
find logs/ -name "error-*.log" -mmin -60 -exec cat {} \; | jq .
```

---

## Daily Monitoring

### Check Error Rate

```bash
cd /path/to/api-backend-nodejs

# Get daily error summary
./scripts/logging/error-summary.sh

# Check today's errors
./scripts/logging/find-errors-by-date.sh $(date +%Y-%m-%d)

# View live logs
pm2 logs cutq-backend-prod

# View only errors
pm2 logs cutq-backend-prod --err

# View last 100 lines
pm2 logs cutq-backend-prod --lines 100
```

### Monitor Disk Usage

```bash
# Check logs directory size
du -sh logs/
du -sh logs/* | sort -h

# Check disk space
df -h

# Count log files
ls -1 logs/*.log | wc -l
ls -1 logs/*.gz | wc -l
```

---

## Helper Scripts

All scripts are located in `api-backend-nodejs/scripts/`:

### 1. `find-user-errors.sh`
Find all errors for a specific customer by userId or email.

```bash
./scripts/logging/find-user-errors.sh user-123
./scripts/logging/find-user-errors.sh customer@example.com
```

### 2. `find-errors-by-date.sh`
Analyze errors for a specific date.

```bash
./scripts/logging/find-errors-by-date.sh 2025-01-11
```

### 3. `error-summary.sh`
Get comprehensive error summary and trends.

```bash
./scripts/logging/error-summary.sh        # Last 7 days
./scripts/logging/error-summary.sh 30     # Last 30 days
```

### 4. `setup-pm2-logrotate.sh`
Setup PM2 log rotation (run once).

```bash
./scripts/logging/setup-pm2-logrotate.sh
```

**PM2 Log Rotation Settings:**
- Max size: 10MB
- Rotated logs: 30 files
- Compression: Enabled
- Rotation: Daily at midnight

---

## Module Filtering

Control which modules log to files using environment variables:

### Enable Specific Modules Only

```bash
# In .env.prod
LOG_MODULES=auth,booking,payment
```

Only auth, booking, and payment modules will log.

### Exclude Specific Modules

```bash
# In .env.prod
LOG_MODULES=all
LOG_EXCLUDE_MODULES=analytics,queue
```

All modules log except analytics and queue.

### Available Modules

- `auth` - Authentication
- `otp` - OTP operations
- `booking` - Booking operations
- `payment` - Payment operations
- `analytics` - Analytics events
- `sms` - SMS notifications
- `email` - Email notifications
- `database` - Database queries
- `api` - API requests
- `admin` - Admin actions
- `upload` - File uploads
- `queue` - Queue operations

---

## Troubleshooting

### Logs Not Rotating?

```bash
# Check winston-daily-rotate-file is installed
cd api-backend-nodejs
npm list winston-daily-rotate-file

# Should show: winston-daily-rotate-file@5.0.0

# Restart the application
pm2 restart cutq-backend-prod

# Check if new log files are created
ls -lh logs/
```

### PM2 Logs Growing Too Large?

```bash
# Check pm2-logrotate status
pm2 ls pm2-logrotate

# Should show: online

# If not installed, run setup script
./scripts/logging/setup-pm2-logrotate.sh

# Or reinstall manually
pm2 uninstall pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

### Disk Space Running Low?

```bash
# Check current disk usage
du -sh logs/

# Manually clean old logs (older than 30 days)
find logs/ -name "*.log" -mtime +30 -delete
find logs/ -name "*.gz" -mtime +60 -delete

# Or reduce retention in src/config/logger.ts
# Change maxFiles: '30d' to '14d' for example
```

### No Logs Being Created?

```bash
# Check if logs directory exists
ls -la logs/

# Check application is running
pm2 status

# Check for errors in PM2 logs
pm2 logs cutq-backend-prod --err

# Check file permissions
ls -la logs/
# Should be writable by the user running PM2
```

---

## Best Practices

1. **Check logs after every deployment**
   ```bash
   pm2 logs cutq-backend-prod --lines 50
   ```

2. **Monitor error rate daily**
   ```bash
   ./scripts/error-summary.sh
   ```

3. **Investigate user-reported bugs immediately**
   ```bash
   ./scripts/find-user-errors.sh <userId>
   ```

4. **Keep jq installed** - Makes log analysis much easier

5. **Set up disk space alerts** - Monitor `/` partition usage
   ```bash
   df -h | grep "/$"
   ```

6. **Review error trends weekly** - Identify recurring issues
   ```bash
   ./scripts/error-summary.sh 7
   ```

7. **Clean up old logs periodically** - If disk space is limited
   ```bash
   find logs/ -name "*.gz" -mtime +90 -delete
   ```

8. **Use request IDs for debugging** - Trace requests across multiple services

---

## Quick Reference

```bash
# View live logs
pm2 logs cutq-backend-prod

# View last 100 lines
pm2 logs cutq-backend-prod --lines 100

# View only errors
pm2 logs cutq-backend-prod --err

# Find user errors
./scripts/logging/find-user-errors.sh user-123

# Error summary
./scripts/logging/error-summary.sh

# Check disk usage
du -sh logs/

# Clean old logs
find logs/ -name "*.log" -mtime +30 -delete

# View today's errors
cat logs/error-$(date +%Y-%m-%d).log | jq .

# Count today's errors
cat logs/error-$(date +%Y-%m-%d).log | wc -l

# Restart application
pm2 restart cutq-backend-prod

# Check PM2 status
pm2 status
```

---

## Zero Breaking Changes

All existing code continues to work exactly as before:

```typescript
// All these still work the same way
import { logger, authLogger, requestLogger } from '@/config/logger';

logger.error('Error message', { userId: '123' });
authLogger.info('User logged in', { userId: '123' });
bookingLogger.warn('Booking conflict', { bookingId: '456' });
```

**Specialized loggers available:**
- `logger` - General logger
- `authLogger` - Authentication
- `otpLogger` - OTP operations
- `bookingLogger` - Bookings
- `paymentLogger` - Payments
- `analyticsLogger` - Analytics
- `smsLogger` - SMS
- `emailLogger` - Email
- `dbLogger` - Database
- `apiLogger` - API requests
- `adminLogger` - Admin actions
- `uploadLogger` - File uploads
- `queueLogger` - Queue operations

---

## Additional Resources

- **Winston Daily Rotate**: https://github.com/winstonjs/winston-daily-rotate-file
- **PM2 Log Rotate**: https://github.com/keymetrics/pm2-logrotate
- **jq Manual**: https://stedolan.github.io/jq/manual/

---

**You now have production-grade logging with automatic management and customer bug tracking! 🎉**


