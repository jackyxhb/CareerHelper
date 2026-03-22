import { test as base, Page } from '@playwright/test';

export class AppPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForSelector(selector: string) {
    await this.page.waitForSelector(selector, { state: 'visible' });
  }

  async click(selector: string) {
    await this.page.click(selector);
  }

  async fill(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async getText(selector: string) {
    return this.page.textContent(selector);
  }

  async isVisible(selector: string) {
    return this.page.isVisible(selector);
  }

  async waitForURL(urlPattern: string | RegExp) {
    await this.page.waitForURL(urlPattern);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}

export class AuthPage extends AppPage {
  async signUp(email: string, password: string, name: string) {
    await this.click('[data-testid="sign-up-button"]');
    await this.fill('input[name="email"]', email);
    await this.fill('input[name="password"]', password);
    await this.fill('input[name="name"]', name);
    await this.click('button[type="submit"]');
  }

  async signIn(email: string, password: string) {
    await this.click('[data-testid="sign-in-button"]');
    await this.fill('input[name="email"]', email);
    await this.fill('input[name="password"]', password);
    await this.click('button[type="submit"]');
  }

  async signOut() {
    await this.click('button:has-text("Sign out")');
  }

  async isAuthenticated() {
    return (
      this.isVisible('text=Dashboard') || this.isVisible('text=CareerHelper')
    );
  }
}

export class DashboardPage extends AppPage {
  async isLoaded() {
    await this.waitForSelector('h1:has-text("CareerHelper")');
  }

  async navigateToJobs() {
    await this.click('a:has-text("Jobs")');
    await this.waitForURL('**/jobs');
  }

  async navigateToExperiences() {
    await this.click('a:has-text("Experiences")');
    await this.waitForURL('**/experiences');
  }

  async navigateToApplications() {
    await this.click('a:has-text("Applications")');
    await this.waitForURL('**/applications');
  }

  async navigateToResumes() {
    await this.click('a:has-text("Resumes")');
    await this.waitForURL('**/resumes');
  }

  async navigateToResumeTailor() {
    await this.click('a:has-text("AI Resume Tailor")');
    await this.waitForURL('**/resume-tailor');
  }

  async getStats() {
    const stats: Record<string, string> = {};
    const statElements = await this.page
      .locator('[data-testid="stat-card"]')
      .all();
    for (const el of statElements) {
      const label = await el
        .locator('[data-testid="stat-label"]')
        .textContent();
      const value = await el
        .locator('[data-testid="stat-value"]')
        .textContent();
      if (label && value) {
        stats[label] = value;
      }
    }
    return stats;
  }
}

export class JobsPage extends AppPage {
  async searchJobs(query: string) {
    await this.fill('input[placeholder*="search" i]', query);
    await this.click('button:has-text("Search")');
    await this.waitForTimeout(1000);
  }

  async getJobCount() {
    const count = await this.getText('[data-testid="job-count"]');
    return parseInt(count || '0', 10);
  }

  async getJobTitles() {
    const titles = await this.page
      .locator('[data-testid="job-title"]')
      .allTextContents();
    return titles;
  }

  async saveJob(jobIndex: number = 0) {
    await this.click(`[data-testid="save-job"]:nth-child(${jobIndex + 1})`);
  }
}

export class ApplicationsPage extends AppPage {
  async createApplication(jobId: string, company: string, position: string) {
    await this.click('button:has-text("New Application")');
    await this.fill('input[name="jobId"]', jobId);
    await this.fill('input[name="company"]', company);
    await this.fill('input[name="position"]', position);
    await this.click('button:has-text("Submit")');
  }

  async updateStatus(applicationIndex: number, status: string) {
    await this.click(
      `[data-testid="application-card"]:nth-child(${applicationIndex + 1})`
    );
    await this.click('select[name="status"]');
    await this.click(`option:has-text("${status}")`);
    await this.click('button:has-text("Update")');
  }

  async getApplicationCount() {
    const count = await this.getText('[data-testid="application-count"]');
    return parseInt(count || '0', 10);
  }

  async getApplicationsByStatus(status: string) {
    await this.click(`button:has-text("${status}")`);
    const cards = await this.page
      .locator('[data-testid="application-card"]')
      .count();
    return cards;
  }
}

export class ExperiencesPage extends AppPage {
  async addExperience(
    title: string,
    company: string,
    startDate: string,
    description: string
  ) {
    await this.click('button:has-text("Add Experience")');
    await this.fill('input[name="title"]', title);
    await this.fill('input[name="company"]', company);
    await this.fill('input[name="startDate"]', startDate);
    await this.fill('textarea[name="description"]', description);
    await this.click('button:has-text("Save")');
  }

  async getExperienceCount() {
    const count = await this.getText('[data-testid="experience-count"]');
    return parseInt(count || '0', 10);
  }

  async deleteExperience(index: number) {
    await this.click(
      `[data-testid="experience-card"]:nth-child(${index + 1}) [data-testid="delete-button"]`
    );
    await this.click('button:has-text("Confirm")');
  }
}

export class ResumesPage extends AppPage {
  async uploadResume(filePath: string) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.click('button:has-text("Upload Resume")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    await this.click('button:has-text("Confirm Upload")');
  }

  async getResumeCount() {
    const count = await this.getText('[data-testid="resume-count"]');
    return parseInt(count || '0', 10);
  }

  async downloadResume(index: number = 0) {
    const downloadPromise = this.page.waitForEvent('download');
    await this.click(
      `[data-testid="resume-card"]:nth-child(${index + 1}) [data-testid="download-button"]`
    );
    return downloadPromise;
  }

  async deleteResume(index: number) {
    await this.click(
      `[data-testid="resume-card"]:nth-child(${index + 1}) [data-testid="delete-button"]`
    );
    await this.click('button:has-text("Confirm")');
  }
}

export class ResumeTailorPage extends AppPage {
  async tailorResume(resumeText: string, jobDescription: string) {
    await this.fill('textarea[name="resumeText"]', resumeText);
    await this.fill('textarea[name="jobDescription"]', jobDescription);
    await this.click('button:has-text("Tailor My Resume")');
    await this.waitForSelector('[data-testid="tailoring-results"]', {
      state: 'visible',
      timeout: 10000,
    });
  }

  async getMatchScore() {
    const score = await this.getText('[data-testid="match-score"]');
    return parseInt(score || '0', 10);
  }

  async getSuggestions() {
    const suggestions = await this.page
      .locator('[data-testid="suggestion"]')
      .allTextContents();
    return suggestions;
  }

  async getKeywordsAdded() {
    const keywords = await this.page
      .locator('[data-testid="keyword-added"]')
      .allTextContents();
    return keywords;
  }
}

export class OnboardingPage extends AppPage {
  async isVisible() {
    return this.isVisible('[data-testid="onboarding-flow"]');
  }

  async skipOnboarding() {
    await this.click('button:has-text("Skip")');
  }

  async completeStep() {
    await this.click('button:has-text("Next")');
    await this.waitForTimeout(500);
  }

  async completeAllSteps() {
    const steps = [
      'Welcome',
      'Build Your Profile',
      'Find Your Next Role',
      "You're All Set!",
    ];
    for (let i = 0; i < steps.length; i++) {
      await this.click('button:has-text("Next")');
      await this.waitForTimeout(500);
    }
  }
}

export const test = base.extend<{
  appPage: AppPage;
  authPage: AuthPage;
  dashboardPage: DashboardPage;
  jobsPage: JobsPage;
  applicationsPage: ApplicationsPage;
  experiencesPage: ExperiencesPage;
  resumesPage: ResumesPage;
  resumeTailorPage: ResumeTailorPage;
  onboardingPage: OnboardingPage;
}>({
  appPage: async ({ page }, use) => {
    await use(new AppPage(page));
  },
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  jobsPage: async ({ page }, use) => {
    await use(new JobsPage(page));
  },
  applicationsPage: async ({ page }, use) => {
    await use(new ApplicationsPage(page));
  },
  experiencesPage: async ({ page }, use) => {
    await use(new ExperiencesPage(page));
  },
  resumesPage: async ({ page }, use) => {
    await use(new ResumesPage(page));
  },
  resumeTailorPage: async ({ page }, use) => {
    await use(new ResumeTailorPage(page));
  },
  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },
});

export { expect } from '@playwright/test';
