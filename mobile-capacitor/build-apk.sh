#!/bin/bash

# CutQ Android Build Script
# This script helps you build APK and AAB files for your CutQ app

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   CutQ Android Build Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "android" ]; then
    echo -e "${RED}Error: android directory not found!${NC}"
    echo "Please run this script from the mobile-capacitor directory"
    exit 1
fi

# Menu
echo "What would you like to build?"
echo ""
echo "1) Debug APK (for testing on your phone)"
echo "2) Release APK (signed, for distribution)"
echo "3) Release AAB (for Google Play Store)"
echo "4) Install Debug APK on connected device"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}Building Debug APK...${NC}"
        cd android
        ./gradlew assembleDebug
        echo ""
        echo -e "${GREEN}✅ Debug APK built successfully!${NC}"
        echo -e "${GREEN}Location: android/app/build/outputs/apk/debug/app-debug.apk${NC}"
        echo ""
        echo "To install on your phone:"
        echo "  adb install app/build/outputs/apk/debug/app-debug.apk"
        ;;
    
    2)
        echo -e "${YELLOW}Building Release APK...${NC}"
        echo ""
        echo -e "${RED}⚠️  Make sure you have:${NC}"
        echo "  1. Generated a keystore file"
        echo "  2. Created keystore.properties"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "Cancelled."
            exit 0
        fi
        cd android
        ./gradlew assembleRelease
        echo ""
        echo -e "${GREEN}✅ Release APK built successfully!${NC}"
        echo -e "${GREEN}Location: android/app/build/outputs/apk/release/app-release.apk${NC}"
        ;;
    
    3)
        echo -e "${YELLOW}Building Release AAB (for Play Store)...${NC}"
        echo ""
        echo -e "${RED}⚠️  Make sure you have:${NC}"
        echo "  1. Generated a keystore file"
        echo "  2. Created keystore.properties"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "Cancelled."
            exit 0
        fi
        cd android
        ./gradlew bundleRelease
        echo ""
        echo -e "${GREEN}✅ Release AAB built successfully!${NC}"
        echo -e "${GREEN}Location: android/app/build/outputs/bundle/release/app-release.aab${NC}"
        echo ""
        echo "Upload this file to Google Play Console"
        ;;
    
    4)
        echo -e "${YELLOW}Installing Debug APK on connected device...${NC}"
        echo ""
        # Check if device is connected
        if ! command -v adb &> /dev/null; then
            echo -e "${RED}Error: adb not found!${NC}"
            echo "Please install Android SDK Platform Tools"
            exit 1
        fi
        
        # Check for connected devices
        devices=$(adb devices | grep -v "List" | grep "device$" | wc -l)
        if [ "$devices" -eq 0 ]; then
            echo -e "${RED}Error: No device connected!${NC}"
            echo "Please connect your phone via USB and enable USB debugging"
            exit 1
        fi
        
        # Build if APK doesn't exist
        if [ ! -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
            echo "APK not found. Building first..."
            cd android
            ./gradlew assembleDebug
            cd ..
        fi
        
        echo "Installing APK..."
        adb install -r android/app/build/outputs/apk/debug/app-debug.apk
        echo ""
        echo -e "${GREEN}✅ APK installed successfully!${NC}"
        echo "You can now open the CutQ app on your phone"
        ;;
    
    5)
        echo "Goodbye!"
        exit 0
        ;;
    
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Done!${NC}"
echo -e "${BLUE}========================================${NC}"

