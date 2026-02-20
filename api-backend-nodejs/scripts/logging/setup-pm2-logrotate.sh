#!/bin/bash

# Script to setup PM2 log rotation
# This prevents PM2 logs from growing indefinitely

echo "=========================================="
echo "Setting up PM2 Log Rotation"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install PM2 first:"
    echo "   npm install -g pm2"
    exit 1
fi

# Install pm2-logrotate module
echo "📦 Installing pm2-logrotate module..."
pm2 install pm2-logrotate

# Configure log rotation settings
echo ""
echo "⚙️  Configuring log rotation settings..."

# Maximum size of log file before rotation (default: 10MB)
pm2 set pm2-logrotate:max_size 10M

# Number of rotated logs to keep (default: 10)
pm2 set pm2-logrotate:retain 30

# Compress rotated logs (default: false)
pm2 set pm2-logrotate:compress true

# Force rotation at specific time (default: disabled)
# Rotate daily at midnight
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

# Rotate logs even if they haven't reached max_size
pm2 set pm2-logrotate:rotateModule true

echo ""
echo "✅ PM2 log rotation configured successfully!"
echo ""
echo "📋 Current configuration:"
pm2 conf pm2-logrotate

echo ""
echo "💡 PM2 logs will now:"
echo "   - Rotate when they reach 10MB"
echo "   - Rotate daily at midnight"
echo "   - Keep last 30 rotated logs"
echo "   - Compress old logs to save space"
echo ""
echo "📁 PM2 logs location: $(pm2 describe cutq-backend-prod 2>/dev/null | grep 'error log path' | awk '{print $NF}')"
echo ""
echo "🔍 To view PM2 logs:"
echo "   pm2 logs cutq-backend-prod"
echo "   pm2 logs cutq-backend-prod --lines 100"
echo "   pm2 logs cutq-backend-prod --err  # Only errors"

