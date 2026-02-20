#!/bin/bash

# Script to find errors by date
# Usage: ./find-errors-by-date.sh <date>

if [ -z "$1" ]; then
    echo "Usage: $0 <date>"
    echo "Example: $0 2025-01-11"
    exit 1
fi

DATE=$1
LOGS_DIR="$(dirname "$0")/../../logs"
ERROR_LOG="$LOGS_DIR/error-$DATE.log"

echo "=========================================="
echo "Errors for date: $DATE"
echo "=========================================="
echo ""

if [ ! -f "$ERROR_LOG" ]; then
    echo "❌ No error log found for $DATE"
    echo "Available logs:"
    ls -1 "$LOGS_DIR"/error-*.log 2>/dev/null | tail -10
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Showing raw logs..."
    cat "$ERROR_LOG"
else
    echo "📊 Error Summary:"
    echo "----------------------------------------"
    
    # Count total errors
    TOTAL_ERRORS=$(cat "$ERROR_LOG" | wc -l)
    echo "Total errors: $TOTAL_ERRORS"
    echo ""
    
    # Show error breakdown by code
    echo "Errors by type:"
    cat "$ERROR_LOG" | jq -r '.error.code' 2>/dev/null | sort | uniq -c | sort -rn
    echo ""
    
    # Show errors by user
    echo "Top 10 users with errors:"
    cat "$ERROR_LOG" | jq -r '.request.userId // "anonymous"' 2>/dev/null | sort | uniq -c | sort -rn | head -10
    echo ""
    
    # Show recent errors
    echo "📋 Recent errors (last 5):"
    echo "----------------------------------------"
    cat "$ERROR_LOG" | jq -c '{time: .timestamp, code: .error.code, message: .error.message, user: .request.userId, url: .request.url}' 2>/dev/null | tail -5
fi

echo ""
echo "✅ Analysis complete"
echo ""
echo "💡 Tip: To see full details of a specific error:"
echo "   cat $ERROR_LOG | jq ."

