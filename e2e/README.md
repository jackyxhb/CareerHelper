# CareerHelper E2E Tests

End-to-end tests using Playwright covering all major user flows.

## Setup

```bash
cd e2e
npm install
npx playwright install chromium
```

## Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run in headed mode
npm run test:headed

# Run smoke tests only
npm run test:smoke

# Run specific test suite
npm run test:auth
npm run test:jobs
npm run test:applications
npm run test:experiences
npm run test:resume

# Run API tests
npx playwright test tests/api.spec.ts
```

## Environment Variables

```bash
# .env file
BASE_URL=http://localhost:3000
API_URL=https://lm5lnut0n5.execute-api.us-east-1.amazonaws.com
E2E_USER_EMAIL=test@example.com
E2E_USER_PASSWORD=TestPassword123!
```

## Test Coverage

### Auth Flow (@auth, @smoke)
- [x] Login page display
- [x] Valid/invalid credentials
- [x] Sign up flow
- [x] Session persistence
- [x] Sign out

### Jobs (@jobs, @smoke)
- [x] Job search by keyword
- [x] Filter by location/salary
- [x] Save jobs
- [x] View job details
- [x] Start application

### Applications (@applications, @smoke)
- [x] List applications
- [x] Create new application
- [x] Update status
- [x] Delete application
- [x] Add notes
- [x] Set reminders

### Experiences (@experiences, @smoke)
- [x] List experiences
- [x] Add new experience
- [x] Edit experience
- [x] Delete experience
- [x] Add skills

### Resumes (@resume)
- [x] List resumes
- [x] Upload resume
- [x] Download resume
- [x] Delete resume
- [x] Set primary resume
- [x] Validation (file type/size)

### AI Resume Tailor (@smoke)
- [x] Tailor resume form
- [x] Match score display
- [x] Keywords suggestions
- [x] Improvement tips
- [x] Form validation

### Dashboard (@smoke)
- [x] Dashboard display
- [x] Navigation menu
- [x] Statistics cards
- [x] Quick actions

### Onboarding
- [x] Welcome step
- [x] Step navigation
- [x] Skip onboarding
- [x] Complete onboarding
- [x] Persist completion

### Additional
- [x] API integration tests
- [x] Performance tests
- [x] Accessibility tests
- [x] Responsive design tests

## Reports

```bash
# Generate HTML report
npm run test:ci

# Open report
npm run report
```

## CI Integration

Add to GitHub Actions:

```yaml
- name: Run E2E Tests
  run: |
    cd e2e
    npm install
    npx playwright install chromium
    npm test
  env:
    BASE_URL: ${{ vars.WEB_URL }}
    E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
    E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
```
