#!/bin/bash

# Script to find errors for a specific user
# Usage: ./find-user-errors.sh <userId or userEmail>

if [ -z "$1" ]; then
    echo "Usage: $0 <userId or userEmail>"
    echo "Example: $0 user-123"
    echo "Example: $0 customer@example.com"
    exit 1
fi

USER_IDENTIFIER=$1
LOGS_DIR="$(dirname "$0")/../../logs"

echo "=========================================="
echo "Searching for errors related to: $USER_IDENTIFIER"
echo "=========================================="
echo ""

# Search in error logs
echo "📋 Recent errors for this user:"
echo "----------------------------------------"

# Search by userId
grep -r "\"userId\":\"$USER_IDENTIFIER\"" "$LOGS_DIR"/error-*.log 2>/dev/null | tail -20

# Search by userEmail
grep -r "\"userEmail\":\"$USER_IDENTIFIER\"" "$LOGS_DIR"/error-*.log 2>/dev/null | tail -20

echo ""
echo "✅ Search complete. Showing last 20 matches."
echo ""
echo "💡 Tip: To see full error details, use:"
echo "   cat logs/error-YYYY-MM-DD.log | jq 'select(.request.userId == \"$USER_IDENTIFIER\")'"

