# TestFlight Beta Setup Guide

This document describes how to set up and distribute the CareerHelper app via TestFlight for beta testing.

## Prerequisites

1. Apple Developer Account ($99/year)
2. Xcode installed
3. App Store Connect access

## Step 1: Create App Store Connect Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platforms**: iOS
   - **Name**: CareerHelper
   - **Primary Language**: English
   - **Bundle ID**: com.careerhelper.app
   - **SKU**: CAREERHELPER001

## Step 2: Configure Xcode Project

1. Open `ios/CareerHelper.xcworkspace` in Xcode
2. Select the project → "Signing & Capabilities"
3. Check "Automatically manage signing"
4. Select your Development Team
5. Bundle Identifier should match App Store Connect

## Step 3: Build for Distribution

```bash
cd mobile/ios
xcodebuild -workspace CareerHelper.xcworkspace \
  -scheme CareerHelper \
  -configuration Release \
  -archivePath build/CareerHelper.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/CareerHelper.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build
```

## Step 4: Upload to App Store Connect

```bash
xcrun altool --upload-app \
  -type ios \
  -file build/CareerHelper.ipa \
  -username "YOUR_APP_STORE_USERNAME" \
  -password "YOUR_APP_STORE_PASSWORD"
```

## Step 5: Configure TestFlight

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
   - Resume upload
   - Offline support
   ```
5. Add beta tester emails

## Step 6: Create External Test Group

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
