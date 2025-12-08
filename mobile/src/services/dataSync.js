import { DataStore } from '@aws-amplify/datastore';
import { API } from 'aws-amplify';
import { v4 as uuidv4 } from 'uuid';
import { Job, Experience, Application } from 'careerhelper-shared';
import { logError, logInfo } from '../utils/logger';

const API_NAME = 'CareerHelperAPI';

export async function syncJobsFromApi() {
  try {
    const jobs = await API.get(API_NAME, '/jobs');
    const existingJobs = await DataStore.query(Job);
    const existingApplications = await DataStore.query(Application);
    const referencedJobIds = new Set(
      existingApplications
        .map(application => application.jobId)
        .filter(jobId => Boolean(jobId))
    );
    const existingMap = new Map(existingJobs.map(job => [job.jobId, job]));
    const seenIds = new Set();

    await Promise.all(
      jobs.map(async job => {
        seenIds.add(job.jobId);
        const matched = existingMap.get(job.jobId);
        if (matched) {
          await DataStore.save(
            Job.copyOf(matched, updated => {
              updated.title = job.title;
              updated.company = job.company;
              updated.location = job.location;
              updated.description = job.description;
              updated.salary = job.salary ?? null;
              updated.postedAt = job.postedAt;
            })
          );
        } else {
          await DataStore.save(
            new Job({
              id: job.jobId,
              jobId: job.jobId,
              title: job.title,
              company: job.company,
              location: job.location ?? null,
              description: job.description ?? '',
              salary: job.salary ?? null,
              postedAt: job.postedAt,
            })
          );
        }
      })
    );

    const stale = existingJobs.filter(
      job => !seenIds.has(job.jobId) && !referencedJobIds.has(job.jobId)
    );
    await Promise.all(stale.map(job => DataStore.delete(job)));
    logInfo('Jobs synchronized into DataStore', { count: jobs.length });
  } catch (error) {
    logError('Failed to sync jobs from API', error);
  }
}

export async function syncExperiencesFromApi(userId) {
  try {
    const experiences = await API.get(API_NAME, `/experiences/${userId}`);
    const existing = await DataStore.query(Experience, e => e.userId('eq', userId));
    const existingMap = new Map(existing.map(item => [item.experienceId, item]));
    const incomingIds = new Set();

    await Promise.all(
      experiences.map(async item => {
        incomingIds.add(item.experienceId);
        const record = existingMap.get(item.experienceId);
        if (record) {
          await DataStore.save(
            Experience.copyOf(record, updated => {
              updated.title = item.title;
              updated.company = item.company;
              updated.startDate = item.startDate;
              updated.endDate = item.endDate ?? null;
              updated.description = item.description ?? '';
              updated.pendingSync = false;
              updated.lastSyncedAt = new Date().toISOString();
            })
          );
        } else {
          await DataStore.save(
            new Experience({
              id: item.experienceId,
              experienceId: item.experienceId,
              userId,
              title: item.title,
              company: item.company,
              startDate: item.startDate,
              endDate: item.endDate ?? null,
              description: item.description ?? '',
              pendingSync: false,
              lastSyncedAt: new Date().toISOString(),
            })
          );
        }
      })
    );

    const stale = existing.filter(item => !incomingIds.has(item.experienceId));
    await Promise.all(stale.map(item => DataStore.delete(item)));
  } catch (error) {
    logError('Failed to sync experiences from API', error, { userId });
  }
}

export async function syncApplicationsFromApi(userId) {
  try {
    const applications = await API.get(API_NAME, `/applications/${userId}`);
    const existing = await DataStore.query(Application, a => a.userId('eq', userId));
    const existingMap = new Map(existing.map(item => [item.applicationId, item]));
    const incomingIds = new Set();

    await Promise.all(
      applications.map(async item => {
        incomingIds.add(item.applicationId);
        const record = existingMap.get(item.applicationId);
        if (record) {
          await DataStore.save(
            Application.copyOf(record, updated => {
              updated.jobId = item.jobId;
              updated.status = item.status;
              updated.appliedAt = item.appliedAt;
              updated.notes = item.notes ?? '';
              updated.jobTitle = item.jobTitle ?? record.jobTitle ?? null;
              updated.jobCompany = item.jobCompany ?? record.jobCompany ?? null;
              updated.jobLocation = item.jobLocation ?? record.jobLocation ?? null;
              updated.jobSource = item.jobSource ?? record.jobSource ?? null;
              updated.pendingSync = false;
              updated.lastSyncedAt = new Date().toISOString();
            })
          );
        } else {
          await DataStore.save(
            new Application({
              id: item.applicationId,
              applicationId: item.applicationId,
              userId,
              jobId: item.jobId,
              status: item.status,
              appliedAt: item.appliedAt,
              notes: item.notes ?? '',
              jobTitle: item.jobTitle ?? null,
              jobCompany: item.jobCompany ?? null,
              jobLocation: item.jobLocation ?? null,
              jobSource: item.jobSource ?? null,
              pendingSync: false,
              lastSyncedAt: new Date().toISOString(),
            })
          );
        }
      })
    );

    const stale = existing.filter(item => !incomingIds.has(item.applicationId));
    await Promise.all(stale.map(item => DataStore.delete(item)));
  } catch (error) {
    logError('Failed to sync applications from API', error, { userId });
  }
}

export async function createLocalExperience(userId, payload) {
  const experienceId = uuidv4();
  const now = new Date().toISOString();

  const record = await DataStore.save(
    new Experience({
      id: experienceId,
      experienceId,
      userId,
      title: payload.title,
      company: payload.company,
      startDate: payload.startDate,
      endDate: payload.endDate ?? null,
      description: payload.description ?? '',
      pendingSync: true,
      lastSyncedAt: null,
    })
  );

  try {
    await API.post(API_NAME, '/experiences', {
      body: {
        userId,
        title: payload.title,
        company: payload.company,
        startDate: payload.startDate,
        endDate: payload.endDate,
        description: payload.description,
      },
    });
    await DataStore.save(
      Experience.copyOf(record, updated => {
        updated.pendingSync = false;
        updated.lastSyncedAt = now;
      })
    );
    logInfo('Experience synced with API after local save');
  } catch (error) {
    logError('Failed to sync experience to API', error, { userId });
  }

  return record;
}

export async function createLocalApplication(userId, payload) {
  const applicationId = uuidv4();
  const now = new Date().toISOString();

  const record = await DataStore.save(
    new Application({
      id: applicationId,
      applicationId,
      userId,
      jobId: payload.jobId,
      status: payload.status,
      appliedAt: payload.appliedAt,
      notes: payload.notes ?? '',
      jobTitle: payload.jobTitle ?? null,
      jobCompany: payload.jobCompany ?? null,
      jobLocation: payload.jobLocation ?? null,
      jobSource: payload.jobSource ?? null,
      pendingSync: true,
      lastSyncedAt: null,
    })
  );

  try {
    await API.post(API_NAME, '/applications', {
      body: {
        userId,
        jobId: payload.jobId,
        status: payload.status,
        notes: payload.notes,
        jobTitle: payload.jobTitle,
        jobCompany: payload.jobCompany,
        jobLocation: payload.jobLocation,
        jobSource: payload.jobSource,
      },
    });
    await DataStore.save(
      Application.copyOf(record, updated => {
        updated.pendingSync = false;
        updated.lastSyncedAt = now;
      })
    );
    logInfo('Application synced with API after local save');
  } catch (error) {
    logError('Failed to sync application to API', error, { userId });
  }

  return record;
}

export async function flushPendingChanges(userId) {
  try {
    const pendingExperiences = await DataStore.query(Experience, e =>
      e.userId('eq', userId).pendingSync('eq', true)
    );

    await Promise.all(
      pendingExperiences.map(async item => {
        try {
          await API.post(API_NAME, '/experiences', {
            body: {
              userId,
              title: item.title,
              company: item.company,
              startDate: item.startDate,
              endDate: item.endDate,
              description: item.description,
            },
          });
          await DataStore.save(
            Experience.copyOf(item, updated => {
              updated.pendingSync = false;
              updated.lastSyncedAt = new Date().toISOString();
            })
          );
        } catch (err) {
          logError('Flush experience sync failed', err, {
            experienceId: item.experienceId,
          });
        }
      })
    );

    const pendingApplications = await DataStore.query(Application, a =>
      a.userId('eq', userId).pendingSync('eq', true)
    );

    await Promise.all(
      pendingApplications.map(async item => {
        try {
          await API.post(API_NAME, '/applications', {
            body: {
              userId,
              jobId: item.jobId,
              status: item.status,
              notes: item.notes,
              jobTitle: item.jobTitle,
              jobCompany: item.jobCompany,
              jobLocation: item.jobLocation,
              jobSource: item.jobSource,
            },
          });
          await DataStore.save(
            Application.copyOf(item, updated => {
              updated.pendingSync = false;
              updated.lastSyncedAt = new Date().toISOString();
            })
          );
        } catch (err) {
          logError('Flush application sync failed', err, {
            applicationId: item.applicationId,
          });
        }
      })
    );
  } catch (error) {
    logError('Flush pending changes failed', error, { userId });
  }
}
