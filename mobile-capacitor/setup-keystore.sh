#!/bin/bash

# CutQ Keystore Setup Script
# This script creates a keystore with default password for easy setup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   CutQ Keystore Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Default password
DEFAULT_PASSWORD="cutq2024"

echo -e "${YELLOW}This script will create a keystore with:${NC}"
echo "  • Keystore password: $DEFAULT_PASSWORD"
echo "  • Key password: $DEFAULT_PASSWORD (same as keystore)"
echo "  • Key alias: cutq-key-alias-bhagat"
echo ""
echo -e "${RED}⚠️  For production, you should use a stronger password!${NC}"
echo ""
read -p "Continue with default password? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo ""
    echo "Cancelled. You can manually create keystore with:"
    echo "  cd android/app"
    echo "  keytool -genkey -v -keystore cutq-release-key.keystore \\"
    echo "    -alias cutq-key-alias-bhagat -keyalg RSA -keysize 2048 -validity 10000"
    exit 0
fi

echo ""
echo -e "${YELLOW}Creating keystore...${NC}"

cd android/app

# Create keystore with default values
keytool -genkey -v \
  -keystore cutq-release-key.keystore \
  -alias cutq-key-alias-bhagat \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$DEFAULT_PASSWORD" \
  -keypass "$DEFAULT_PASSWORD" \
  -dname "CN=CutQ, OU=Development, O=CutQ, L=New Delhi, ST=Delhi, C=IN" \
  -noprompt

echo ""
echo -e "${GREEN}✅ Keystore created successfully!${NC}"
echo ""

# Create keystore.properties
cd ..
cat > keystore.properties << EOF
storePassword=$DEFAULT_PASSWORD
keyPassword=$DEFAULT_PASSWORD
keyAlias=cutq-key-alias-bhagat
storeFile=cutq-release-key.keystore
EOF

echo -e "${GREEN}✅ keystore.properties created!${NC}"
echo ""

# Show the details
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Keystore Details:"
echo "  • Location: android/app/cutq-release-key.keystore"
echo "  • Password: $DEFAULT_PASSWORD"
echo "  • Alias: cutq-key-alias-bhagat"
echo ""
echo "Configuration:"
echo "  • File: android/keystore.properties"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "  1. Backup the keystore file securely"
echo "  2. Remember the password: $DEFAULT_PASSWORD"
echo "  3. Never commit keystore files to Git"
echo ""
echo -e "${GREEN}You can now build release APK/AAB!${NC}"
echo ""
echo "Next steps:"
echo "  ./build-apk.sh"
echo "  Select option 2 (Release APK) or 3 (Release AAB)"
echo ""

