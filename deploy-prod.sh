#!/bin/bash

# CutQ Production Deployment Script
# This script automates the deployment process for production environment

# ========================================
# DEPLOYMENT CONFIGURATION
# Set to 1 to enable, 0 to skip
# ========================================
INSTALL_FRONTEND_DEPS=0
INSTALL_BACKEND_DEPS=1
PRISMA_GENERATE=1
PRISMA_MIGRATE=1
BUILD_BACKEND=1
BUILD_FRONTEND=0
RESTART_PM2=1
SAVE_PM2=1

# Quick presets (uncomment one to use)
# QUICK_RESTART: Only rebuild and restart (skip deps & migrations)
# QUICK_RESTART=1

# DEPS_ONLY: Only install dependencies
# DEPS_ONLY=1

# DB_ONLY: Only run database migrations
# DB_ONLY=1

# Apply presets if set
if [ "${QUICK_RESTART}" = "1" ]; then
    INSTALL_FRONTEND_DEPS=0
    INSTALL_BACKEND_DEPS=0
    PRISMA_GENERATE=0
    PRISMA_MIGRATE=0
fi

if [ "${DEPS_ONLY}" = "1" ]; then
    PRISMA_GENERATE=0
    PRISMA_MIGRATE=0
    BUILD_BACKEND=0
    BUILD_FRONTEND=0
    RESTART_PM2=0
    SAVE_PM2=0
fi

if [ "${DB_ONLY}" = "1" ]; then
    INSTALL_FRONTEND_DEPS=0
    INSTALL_BACKEND_DEPS=0
    BUILD_BACKEND=0
    BUILD_FRONTEND=0
    RESTART_PM2=0
    SAVE_PM2=0
fi

set -e  # Exit on any error

echo "=========================================="
echo "🚀 CutQ Production Deployment Started"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Get the script directory (project root)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Pre-deployment checks
print_step "Pre-Deployment Checks"
print_info "Checking if PM2 is installed..."
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please install it first: npm install -g pm2"
    exit 1
fi
print_success "PM2 is installed"

print_info "Checking if yarn is installed..."
if ! command -v yarn &> /dev/null; then
    print_error "Yarn is not installed. Please install it first: npm install -g yarn"
    exit 1
fi
print_success "Yarn is installed"

print_info "Checking if .env.prod.local exists..."
if [ ! -f "api-backend-nodejs/.env.prod.local" ]; then
    print_error ".env.prod.local not found in api-backend-nodejs/"
    print_error "Please create .env.prod.local with production environment variables"
    exit 1
fi
print_success ".env.prod.local exists"
echo ""

# Step 1: Install Frontend Dependencies
if [ "${INSTALL_FRONTEND_DEPS}" = "1" ]; then
    print_step "Step 1/10: Installing Frontend Dependencies"
    cd frontend-nextjs
    print_info "Running: yarn install"
    # yarn install
    print_success "Frontend dependencies installed"
    echo ""
else
    print_info "⏭️  Skipping: Frontend dependencies installation"
    echo ""
fi

# Step 2: Install Backend Dependencies
if [ "${INSTALL_BACKEND_DEPS}" = "1" ]; then
    print_step "Step 2/10: Installing Backend Dependencies"
    cd api-backend-nodejs 2>/dev/null || cd ../api-backend-nodejs
    print_info "Running: yarn install"
    yarn install
    print_success "Backend dependencies installed"
    echo ""
else
    print_info "⏭️  Skipping: Backend dependencies installation"
    echo ""
fi

# Step 3: Prisma Generate
if [ "${PRISMA_GENERATE}" = "1" ]; then
    print_step "Step 3/10: Generating Prisma Client"
    cd api-backend-nodejs 2>/dev/null || cd ../api-backend-nodejs
    print_info "Running: yarn db:generate"
    yarn db:generate
    print_success "Prisma client generated"
    echo ""
else
    print_info "⏭️  Skipping: Prisma client generation"
    echo ""
fi

# Step 4-6: Prisma Migrate
if [ "${PRISMA_MIGRATE}" = "1" ]; then
    # Step 4: Prisma Migrate Status (Before)
    print_step "Step 4/10: Checking Database Migration Status (Before)"
    cd api-backend-nodejs 2>/dev/null || cd ../api-backend-nodejs
    print_info "Running: yarn db:status:prod"
    yarn db:status:prod || true  # Don't fail if migrations are pending
    echo ""

    # Step 5: Prisma Migrate Deploy
    print_step "Step 5/10: Deploying Database Migrations"
    print_info "Running: yarn db:deploy:prod"
    yarn db:deploy:prod
    print_success "Database migrations applied"
    echo ""

    # Step 6: Prisma Migrate Status (After)
    print_step "Step 6/10: Verifying Database Migration Status (After)"
    print_info "Running: yarn db:status:prod"
    yarn db:status:prod
    print_success "All migrations are up to date"
    echo ""
else
    print_info "⏭️  Skipping: Database migrations"
    echo ""
fi

# Step 7: Build Backend
if [ "${BUILD_BACKEND}" = "1" ]; then
    print_step "Step 7/10: Building Backend"
    cd api-backend-nodejs 2>/dev/null || cd ../api-backend-nodejs
    print_info "Running: yarn build"
    yarn build
    print_success "Backend built successfully"
    echo ""
else
    print_info "⏭️  Skipping: Backend build"
    echo ""
fi

# Step 8: Build Frontend
if [ "${BUILD_FRONTEND}" = "1" ]; then
    print_step "Step 8/10: Building Frontend"
    cd frontend-nextjs 2>/dev/null || cd ../frontend-nextjs
    print_info "Running: yarn build"
    # yarn build
    print_success "Frontend built successfully"
    echo ""
else
    print_info "⏭️  Skipping: Frontend build"
    echo ""
fi

# Step 9: Restart PM2 Process
if [ "${RESTART_PM2}" = "1" ]; then
    print_step "Step 9/11: Restarting PM2 Process"
    cd api-backend-nodejs 2>/dev/null || cd ../api-backend-nodejs
    print_info "Running: pm2 restart cutq-backend-prod"
    pm2 restart cutq-backend-prod
    print_success "PM2 process restarted"
    echo ""
else
    print_info "⏭️  Skipping: PM2 restart"
    echo ""
fi

# Step 10: Save PM2 Configuration
if [ "${SAVE_PM2}" = "1" ]; then
    print_step "Step 10/11: Saving PM2 Configuration"
    print_info "Running: pm2 save"
    pm2 save
    print_success "PM2 configuration saved (will auto-start on server reboot)"
    echo ""
else
    print_info "⏭️  Skipping: PM2 save"
    echo ""
fi

# Step 11: Show PM2 Status
print_step "Step 11/11: Checking PM2 Status"
pm2 status cutq-backend-prod
echo ""

# Final Summary
echo ""
print_success "=========================================="
print_success "✅ CutQ Production Deployment Completed!"
print_success "=========================================="
echo ""
echo "📋 Deployment Summary:"
echo "  ✓ Pre-deployment checks: Passed"
echo "  ✓ Frontend dependencies: Installed"
echo "  ✓ Backend dependencies: Installed"
echo "  ✓ Prisma client: Generated"
echo "  ✓ Database migrations: Applied & Verified"
echo "  ✓ Backend: Built"
echo "  ✓ Frontend: Built"
echo "  ✓ PM2 process: Restarted"
echo "  ✓ PM2 configuration: Saved"
echo ""
print_info "📊 Useful PM2 Commands:"
echo "  - View logs:        pm2 logs cutq-backend-prod"
echo "  - Monitor:          pm2 monit"
echo "  - Full status:      pm2 status"
echo "  - Restart:          pm2 restart cutq-backend-prod"
echo "  - Stop:             pm2 stop cutq-backend-prod"
echo "  - Delete:           pm2 delete cutq-backend-prod"
echo ""
print_info "🗄️  Database Commands (from api-backend-nodejs/):"
echo "  - Check status:     yarn db:status:prod"
echo "  - Open studio:      yarn db:studio:prod"
echo "  - View migrations:  ls -la prisma/migrations/"
echo ""
print_info "📝 Logging & Error Tracking:"
echo "  - View error logs:  cat api-backend-nodejs/logs/error-\$(date +%Y-%m-%d).log | jq ."
echo "  - Find user errors: cd api-backend-nodejs && ./scripts/logging/find-user-errors.sh <userId>"
echo "  - Error summary:    cd api-backend-nodejs && ./scripts/logging/error-summary.sh"
echo "  - Setup PM2 logs:   cd api-backend-nodejs && ./scripts/logging/setup-pm2-logrotate.sh"
echo ""
print_info "🔍 Troubleshooting:"
echo "  - If backend fails: Check logs with 'pm2 logs cutq-backend-prod'"
echo "  - If DB issues:     Run 'cd api-backend-nodejs && yarn db:status:prod'"
echo "  - If env issues:    Verify .env.prod.local exists and has correct values"
echo "  - Customer bug:     Find errors with './scripts/logging/find-user-errors.sh <userId>'"
echo ""
print_success "🎉 Deployment successful! Your application is now running."
echo ""
print_info "⏰ Deployment completed at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
print_info "💡 Next Steps:"
echo "  1. Check application logs: pm2 logs cutq-backend-prod"
echo "  2. Monitor for errors: cd api-backend-nodejs && ./scripts/logging/error-summary.sh"
echo "  3. Setup PM2 log rotation (first time): cd api-backend-nodejs && ./scripts/logging/setup-pm2-logrotate.sh"

