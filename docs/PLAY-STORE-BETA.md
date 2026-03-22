# Play Store Beta Setup Guide

This document describes how to set up and distribute the CareerHelper app via Google Play for beta testing.

## Prerequisites

1. Google Play Developer Account ($25 one-time)
2. Android Studio installed
3. Google Cloud Console access

## Step 1: Create Google Play Console Record

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - **App name**: CareerHelper
   - **Default language**: English (US)
   - **App type**: Android app
   - **Free or paid**: Free

## Step 2: Configure App Signing

### Option A: Use Play App Signing (Recommended)
1. Go to Release → Setup → App signing
2. Enroll in Play App Signing (free)
3. Google generates a signing key
4. Export your upload key to `upload-keystore.jks`

### Option B: Use Your Own Key
1. Generate a keystore:
   ```bash
   keytool -genkeypair \
     -v -storetype PKCS12 \
     -keystore careerhelper-upload-keystore.jks \
     -alias upload \
     -keyalg RSA \
     -keysize 2048 \
     -validity 10000
   ```
2. Upload the `.pem` certificate

## Step 3: Build Android APK/AAB

```bash
cd mobile/android

# Debug build (for internal testing)
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Release build (for beta)
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
# Or .aab for Play Store: app/build/outputs/bundle/release/app-release.aab
```

## Step 4: Create Beta Track

1. Go to Release → Production → Create release
2. Or use the Testing tab for beta tracks

### Track Types:
- **Internal testing**: Fast, up to 100 testers
- **Closed testing (Alpha)**: Up to 2000 testers, per-email or Google Group
- **Open testing (Beta)**: Public, anyone can join
- **Production**: Public release

## Step 5: Upload AAB

1. Go to Testing → Closed testing → Alpha
2. Click "Create new release" or "Upload"
3. Select your `.aab` file
4. Add "What's new in this release":
   ```
   CareerHelper Beta - Your career management companion
   
   This beta includes:
   - Job search and tracking
   - Application management
   - Experience portfolio builder
   - Resume upload and storage
   - Offline support
   ```

## Step 6: Configure Tester Access

### Closed Testing (Alpha)
1. Create tester email list or Google Group
2. Add emails: tester1@example.com, tester2@example.com
3. Or use opt-in URL: `https://play.google.com/apps/internaltest/...`

### Open Testing (Beta)
1. Enable open testing
2. Use opt-in link: `https://play.google.com/apps/testing/com.careerhelper.app`
3. Share link with testers

## Step 7: Track Testing

### Metrics Available:
- **Installs**: Number of beta testers
- **Crashes**: Crash-free session rate
- **ANRs**: Application Not Responding
- **Ratings**: Beta tester feedback
- **Retention**: Day 1/7/30 retention

### Console Reports:
- Crashes and ANRs → Android Vitals
- Reviews and feedback → User feedback
- Pre-launch reports → Automated testing

## Distribution Checklist

- [ ] App signing configured
- [ ] AAB file built
- [ ] Alpha/Closed track created
- [ ] What's new text added
- [ ] Tester emails added or opt-in enabled
- [ ] Testing feedback configured
- [ ] Privacy policy URL added
- [ ] Content rating questionnaire completed

## Common Issues

### "Upload failed: Package not signed correctly"
- Check keystore matches uploaded certificate
- Ensure `build.gradle` uses correct signing config

### "Track not available"
- Complete store listing first
- Finish content rating questionnaire

### "Testers can't find app"
- Ensure they're on the correct Google account
- Check if invite email was received
- Verify opt-in link is correct

## Gradle Signing Configuration

In `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('careerhelper-upload-keystore.jks')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'upload'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```
