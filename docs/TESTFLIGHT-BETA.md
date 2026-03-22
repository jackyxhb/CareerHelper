# TestFlight Beta Setup Guide

This document describes how to set up and distribute the CareerHelper React Native app via TestFlight for beta testing.

## Prerequisites

1. Apple Developer Account ($99/year)
2. Node.js 18+ and yarn installed
3. Xcode installed (for iOS builds)
4. App Store Connect access

## Build the App

### Option A: Build iOS Natively

1. Install CocoaPods dependencies:
```bash
cd mobile/ios
pod install
```

2. Build using Xcode:
- Open `ios/CareerHelper.xcworkspace`
- Select "Any iOS Device (arm64)"
- Product → Build

3. Or from command line:
```bash
cd mobile
react-native build-ios --configuration Release
```

### Option B: Use Expo (Recommended for Faster Builds)

1. Install Expo CLI:
```bash
npm install -g expo-cli
```

2. Generate iOS build:
```bash
cd mobile
expo build:ios --release-channel beta
```

## Step 5: Configure App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platforms**: iOS
   - **Name**: CareerHelper
   - **Primary Language**: English
   - **Bundle ID**: com.careerhelper.app
   - **SKU**: CAREERHELPER001

## Step 6: Configure Signing

1. Open `mobile/ios/CareerHelper.xcworkspace` in Xcode
2. Select the project → "Signing & Capabilities"
3. Check "Automatically manage signing"
4. Select your Development Team
5. Bundle Identifier should match App Store Connect (`com.careerhelper.app`)

## Step 7: Upload to App Store Connect

### Using Transporter (Recommended)
1. Download [Transporter](https://apps.apple.com/us/app/transporter/id1450874344) from Mac App Store
2. Sign in with your Apple Developer account
3. Drag your `.ipa` or `.xcarchive` file
4. Click "Deliver"

### Using Command Line
```bash
xcrun altool --upload-app \
  -type ios \
  -file build/CareerHelper.ipa \
  -username "YOUR_APP_STORE_USERNAME" \
  -password "YOUR_APP_STORE_PASSWORD"
```

## Step 8: Configure TestFlight

1. Go to App Store Connect → TestFlight tab
2. Click on your build
3. Add "What's New" test info
4. Set Beta App Description:
   ```
   CareerHelper helps you manage your career journey.
   Track jobs, applications, and experiences in one place.
   
   This beta version includes:
   - Job search and tracking
   - Application management
   - Experience portfolio
   - Resume upload with AI tailoring
   - Analytics dashboard
   - Offline support
   ```
5. Add beta tester emails

## Step 9: Create External Test Group

1. Go to TestFlight → External Testing
2. Create a new group "Beta Users"
3. Add up to 10,000 external testers
4. Submit for Apple review (first time only)

## Distribution Options

### Option A: Direct Invite
1. Add tester emails
2. They receive email invite
3. Download TestFlight app
4. Access beta build

### Option B: Public Link
1. Generate a public link in App Store Connect
2. Share the link
3. Anyone with the link can join

## Beta Testing Checklist

- [ ] Build passes validation
- [ ] TestFlight build processed
- [ ] External testing enabled
- [ ] Beta description written
- [ ] Contact email set
- [ ] Feedback email configured
- [ ] Privacy policy URL added
- [ ] Minimum iOS version specified

## Common Issues

### "Build not available"
- Wait for Apple to process the build (10-30 min)
- Check for code signing issues

### "External testing not available"
- First submission requires Apple review
- Subsequent builds are auto-approved

### "Tester cannot see build"
- Ensure tester accepted the invite
- Check if build expired (90 days)
