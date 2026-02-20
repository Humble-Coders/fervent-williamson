# CutQ Backend Scripts

This directory contains utility scripts organized by functionality for better maintainability and accessibility.

## 📁 Directory Structure

```
scripts/
├── environment/     # Environment and startup scripts
├── logging/         # Production logging and error analysis scripts
├── utilities/       # General utility scripts
└── README.md        # This file
```

---

## 🌍 Environment Scripts (`environment/`)

Scripts for managing environment variables and application startup.

### **`load-env.js`**
- **Purpose**: Loads environment variables based on `CUTQ_ENV`
- **Usage**: Required by other scripts (imported automatically)
- **Environments**: `dev`, `uat`, `prod`

### **`start-with-env.js`**
- **Purpose**: Starts the application with correct environment
- **Usage**: Used by npm scripts and PM2
- **Example**: `node scripts/environment/start-with-env.js node dist/index.js`

### **`prisma-with-env.js`**
- **Purpose**: Runs Prisma CLI commands with environment-specific config
- **Usage**: Used by database scripts in package.json
- **Example**: `node scripts/environment/prisma-with-env.js migrate status`

### **`setup-db-env.js`**
- **Purpose**: Sets up DATABASE_URL for Prisma CLI
- **Usage**: Configures database connection based on USE_REMOTE_DB flag
- **Example**: `node scripts/environment/setup-db-env.js`

---

## 📊 Logging Scripts (`logging/`)

Scripts for production error analysis and log management.

### **`error-summary.sh`**
- **Purpose**: Generate error summary across all logs
- **Usage**: `./scripts/logging/error-summary.sh [days]`
- **Example**: `./scripts/logging/error-summary.sh 7` (last 7 days)
- **Requirements**: `jq` (JSON processor)

### **`find-errors-by-date.sh`**
- **Purpose**: Find all errors for a specific date
- **Usage**: `./scripts/logging/find-errors-by-date.sh <date>`
- **Example**: `./scripts/logging/find-errors-by-date.sh 2025-01-11`
- **Requirements**: `jq` (optional, for formatted output)

### **`find-user-errors.sh`**
- **Purpose**: Find errors related to a specific user
- **Usage**: `./scripts/logging/find-user-errors.sh <userId|email>`
- **Example**: `./scripts/logging/find-user-errors.sh user@example.com`

### **`setup-pm2-logrotate.sh`**
- **Purpose**: Configure PM2 log rotation for production
- **Usage**: `./scripts/logging/setup-pm2-logrotate.sh`
- **Features**: 
  - Rotates logs daily at midnight
  - Keeps 30 days of logs
  - Compresses old logs

---

## 🔧 Utilities (`utilities/`)

General utility scripts for development and debugging.

### **`test-db-connection.js`**
- **Purpose**: Test database connection
- **Usage**: `node scripts/utilities/test-db-connection.js`
- **Useful for**: Debugging database connectivity issues

---

## 📝 Usage in package.json

The scripts are referenced in `package.json` with their new paths:

```json
{
  "scripts": {
    "start": "cross-env CUTQ_ENV=prod node scripts/environment/start-with-env.js node dist/index.js",
    "dev": "cross-env CUTQ_ENV=dev node scripts/environment/start-with-env.js nodemon --exec ts-node -r tsconfig-paths/register src/index.ts"
  }
}
```

---

## 🚀 Quick Reference

### **Start Application**
```bash
# Development
npm run dev

# Production
npm run start:prod
```

### **Database Operations**
```bash
# Check migration status
npm run db:status:prod

# Deploy migrations
npm run db:deploy:prod
```

### **Error Analysis**
```bash
# Last 7 days error summary
./scripts/logging/error-summary.sh 7

# Errors for specific date
./scripts/logging/find-errors-by-date.sh 2025-01-11

# User-specific errors
./scripts/logging/find-user-errors.sh user@example.com
```

### **Database Testing**
```bash
# Test database connection
node scripts/utilities/test-db-connection.js
```

---

## 📚 Additional Documentation

- **Logging Documentation**: See `markdown/api-backend-nodejs/LOGGING.md`
- **Project Overview**: See `PROJECT_OVERVIEW.md`
- **Environment Setup**: See `.env.example` files

---

## 🔒 Security Notes

- Never commit `.env.*.local` files
- Keep production credentials secure
- Use environment-specific configurations
- Review logs regularly for security issues

---

**Last Updated**: 2025-01-11

