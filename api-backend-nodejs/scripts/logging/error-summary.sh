#!/bin/bash

# Script to generate error summary across all logs
# Usage: ./error-summary.sh [days]

DAYS=${1:-7}  # Default to last 7 days
LOGS_DIR="$(dirname "$0")/../../logs"

echo "=========================================="
echo "Error Summary (Last $DAYS days)"
echo "=========================================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Please install jq for detailed analysis."
    echo "   macOS: brew install jq"
    echo "   Linux: sudo apt-get install jq"
    exit 1
fi

# Find error logs from last N days
ERROR_LOGS=$(find "$LOGS_DIR" -name "error-*.log" -mtime -$DAYS 2>/dev/null)

if [ -z "$ERROR_LOGS" ]; then
    echo "❌ No error logs found for the last $DAYS days"
    exit 1
fi

# Total error count
TOTAL_ERRORS=$(cat $ERROR_LOGS 2>/dev/null | wc -l)
echo "📊 Total Errors: $TOTAL_ERRORS"
echo ""

# Top 10 error types
echo "🔝 Top 10 Error Types:"
echo "----------------------------------------"
cat $ERROR_LOGS 2>/dev/null | jq -r '.error.code // "UNKNOWN"' | sort | uniq -c | sort -rn | head -10
echo ""

# Top 10 error messages
echo "💬 Top 10 Error Messages:"
echo "----------------------------------------"
cat $ERROR_LOGS 2>/dev/null | jq -r '.error.message' | sort | uniq -c | sort -rn | head -10
echo ""

# Top 10 affected endpoints
echo "🌐 Top 10 Affected Endpoints:"
echo "----------------------------------------"
cat $ERROR_LOGS 2>/dev/null | jq -r '.request.url' | sort | uniq -c | sort -rn | head -10
echo ""

# Top 10 users with errors
echo "👥 Top 10 Users with Errors:"
echo "----------------------------------------"
cat $ERROR_LOGS 2>/dev/null | jq -r '.request.userId // "anonymous"' | sort | uniq -c | sort -rn | head -10
echo ""

# Errors by status code
echo "📈 Errors by Status Code:"
echo "----------------------------------------"
cat $ERROR_LOGS 2>/dev/null | jq -r '.error.statusCode // "unknown"' | sort | uniq -c | sort -rn
echo ""

# Errors by hour (for today)
TODAY=$(date +%Y-%m-%d)
if [ -f "$LOGS_DIR/error-$TODAY.log" ]; then
    echo "⏰ Errors by Hour (Today):"
    echo "----------------------------------------"
    cat "$LOGS_DIR/error-$TODAY.log" 2>/dev/null | jq -r '.timestamp' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c
    echo ""
fi

echo "✅ Summary complete"
echo ""
echo "💡 Useful commands:"
echo "   - View specific date: ./find-errors-by-date.sh 2025-01-11"
echo "   - Find user errors: ./find-user-errors.sh user-123"
echo "   - View raw logs: cat logs/error-$TODAY.log | jq ."

