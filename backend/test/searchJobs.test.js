'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// ---------------------------------------------------------------------------
// Pure-function unit tests (no I/O)
// ---------------------------------------------------------------------------

// Load pure exports directly (handler not exercised here)
const {
  detectAdzunaCountry,
  deduplicateJobs,
  sanitizeForRetry,
  normalizeJSearchJob,
  normalizeAdzunaJob,
} = proxyquire('../functions/searchJobs', {
  '../utils/secrets': { secretsManager: {} },
  '../utils/logger': class {
    info() {}
    warn() {}
    error() {}
  },
  '../utils/errorHandler': {
    ErrorHandler: {},
    ValidationError: class extends Error {},
  },
  '../utils/requestHandler': {
    RequestHandler: class {
      createResponse(fn) {
        return fn;
      }
    },
  },
  'aws-lambda': {},
});

describe('detectAdzunaCountry', () => {
  it('detects NZ keywords', () => {
    expect(detectAdzunaCountry('Auckland')).to.equal('nz');
    expect(detectAdzunaCountry('Wellington')).to.equal('nz');
    expect(detectAdzunaCountry('New Zealand')).to.equal('nz');
  });

  it('detects AU keywords', () => {
    expect(detectAdzunaCountry('Sydney')).to.equal('au');
    expect(detectAdzunaCountry('Melbourne')).to.equal('au');
    expect(detectAdzunaCountry('Australia')).to.equal('au');
  });

  it('returns null for non-NZ/AU locations', () => {
    expect(detectAdzunaCountry('London')).to.be.null;
    expect(detectAdzunaCountry('New York')).to.be.null;
    expect(detectAdzunaCountry('')).to.be.null;
  });

  it('is case-insensitive', () => {
    expect(detectAdzunaCountry('AUCKLAND')).to.equal('nz');
    expect(detectAdzunaCountry('SYDNEY')).to.equal('au');
  });
});

describe('deduplicateJobs', () => {
  const job = (title, company, source = 'JSearch') => ({
    jobId: `${source}-1`,
    title,
    company,
    location: '',
    description: null,
    externalUrl: null,
    publishedAt: null,
    salary: null,
    source,
  });

  it('removes exact-match duplicates', () => {
    const jobs = [
      job('Software Engineer', 'Acme'),
      job('Software Engineer', 'Acme'),
    ];
    expect(deduplicateJobs(jobs)).to.have.length(1);
  });

  it('deduplicates case-insensitively', () => {
    const jobs = [
      job('software engineer', 'acme'),
      job('Software Engineer', 'Acme'),
    ];
    expect(deduplicateJobs(jobs)).to.have.length(1);
  });

  it('keeps jobs with different titles or companies', () => {
    const jobs = [
      job('Software Engineer', 'Acme'),
      job('Product Manager', 'Acme'),
      job('Software Engineer', 'Globex'),
    ];
    expect(deduplicateJobs(jobs)).to.have.length(3);
  });

  it('preserves the first occurrence (Adzuna preferred when placed first)', () => {
    const adzuna = job('Developer', 'Acme', 'Seek/Adzuna');
    const jsearch = job('Developer', 'Acme', 'JSearch');
    const result = deduplicateJobs([adzuna, jsearch]);
    expect(result[0].source).to.equal('Seek/Adzuna');
  });
});

describe('sanitizeForRetry', () => {
  it('strips special characters', () => {
    expect(sanitizeForRetry('Auckland <NZ>')).to.equal('Auckland NZ');
    expect(sanitizeForRetry('São Paulo')).to.equal('So Paulo');
  });

  it('preserves alphanumeric, spaces, commas, dots, hyphens', () => {
    expect(sanitizeForRetry('New Zealand, North-Island 2024')).to.equal(
      'New Zealand, North-Island 2024'
    );
  });

  it('trims whitespace', () => {
    expect(sanitizeForRetry('  Auckland  ')).to.equal('Auckland');
  });
});

describe('normalizeJSearchJob', () => {
  it('maps fields correctly', () => {
    const raw = {
      job_id: 'j1',
      job_title: 'Engineer',
      employer_name: 'Acme',
      job_city: 'Auckland',
      job_country: 'NZ',
      job_description: 'Build stuff',
      job_apply_link: 'https://example.com',
      job_posted_at_datetime_utc: '2026-01-01',
      job_salary_currency: 'NZD',
      job_min_salary: 80000,
      job_max_salary: 100000,
    };
    const result = normalizeJSearchJob(raw);
    expect(result.jobId).to.equal('jsearch-j1');
    expect(result.title).to.equal('Engineer');
    expect(result.company).to.equal('Acme');
    expect(result.location).to.equal('Auckland, NZ');
    expect(result.externalUrl).to.equal('https://example.com');
    expect(result.source).to.equal('JSearch');
    expect(result.salary).to.include('NZD');
  });

  it('uses Unknown Employer when employer_name missing', () => {
    const raw = { job_id: 'j2', job_title: 'Dev' };
    expect(normalizeJSearchJob(raw).company).to.equal('Unknown Employer');
  });

  it('returns null salary when no salary data', () => {
    const raw = { job_id: 'j3', job_title: 'Dev' };
    expect(normalizeJSearchJob(raw).salary).to.be.null;
  });
});

describe('normalizeAdzunaJob', () => {
  it('maps fields correctly', () => {
    const raw = {
      id: 'a1',
      title: 'Designer',
      company: { display_name: 'Studio NZ' },
      location: { display_name: 'Auckland, NZ' },
      description: 'Design stuff',
      redirect_url: 'https://adzuna.co.nz/job/a1',
      created: '2026-01-15',
      salary_min: 70000,
      salary_max: 90000,
    };
    const result = normalizeAdzunaJob(raw);
    expect(result.jobId).to.equal('adzuna-a1');
    expect(result.title).to.equal('Designer');
    expect(result.company).to.equal('Studio NZ');
    expect(result.location).to.equal('Auckland, NZ');
    expect(result.source).to.equal('Seek/Adzuna');
    expect(result.salary).to.include('70');
  });

  it('uses Unknown Employer when company missing', () => {
    const raw = { id: 'a2', title: 'Dev' };
    expect(normalizeAdzunaJob(raw).company).to.equal('Unknown Employer');
  });
});

// ---------------------------------------------------------------------------
// Handler integration tests
// Use a plain proxyquire (not noCallThru) so the real RequestHandler/ErrorHandler
// are loaded. Stub secretsManager via sinon on the real singleton.
// ---------------------------------------------------------------------------

const proxyquireNoCT = require('proxyquire');
const { secretsManager } = require('../utils/secrets');

describe('searchJobs handler', () => {
  // Load handler once with real deps; stub secretsManager + fetch per test
  const { handler } = proxyquireNoCT('../functions/searchJobs', {});

  const makeEvent = (query, location) => ({
    requestContext: { requestId: 'req-test' },
    queryStringParameters: { query, ...(location ? { location } : {}) },
  });

  afterEach(() => {
    sinon.restore();
  });

  const stubSecrets = (jSearchKey = 'key-123', adzunaCreds = null) => {
    sinon.stub(secretsManager, 'getJobSearchApiKey').resolves(jSearchKey);
    sinon.stub(secretsManager, 'getAdzunaCredentials').resolves(adzunaCreds);
  };

  const stubFetch = data =>
    sinon.stub(global, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(''),
    });

  it('returns 400 when query is missing', async () => {
    stubSecrets();
    const resp = await handler({
      requestContext: { requestId: 'r1' },
      queryStringParameters: {},
    });
    expect(resp.statusCode).to.equal(400);
  });

  it('returns JSearch results for a plain query', async () => {
    stubSecrets();
    stubFetch({
      data: [
        {
          job_id: 'j1',
          job_title: 'Engineer',
          employer_name: 'Acme',
          job_city: 'London',
        },
      ],
    });

    const resp = await handler(makeEvent('Engineer', null));
    expect(resp.statusCode).to.equal(200);
    const body = JSON.parse(resp.body);
    expect(body.jobs).to.have.length(1);
    expect(body.jobs[0].source).to.equal('JSearch');
  });

  it('triggers Adzuna for Auckland location and merges results', async () => {
    stubSecrets('key-123', { appId: 'id', appKey: 'key' });
    sinon
      .stub(global, 'fetch')
      .onFirstCall()
      .resolves({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ job_id: 'j1', job_title: 'Dev', employer_name: 'Co A' }],
          }),
        text: () => Promise.resolve(''),
      })
      .onSecondCall()
      .resolves({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                id: 'a1',
                title: 'Dev',
                company: { display_name: 'Co B' },
                location: { display_name: 'Auckland' },
              },
            ],
          }),
        text: () => Promise.resolve(''),
      });

    const resp = await handler(makeEvent('Dev', 'Auckland'));
    expect(resp.statusCode).to.equal(200);
    const body = JSON.parse(resp.body);
    expect(body.jobs[0].source).to.equal('Seek/Adzuna');
    expect(body.total).to.equal(2);
  });

  it('deduplicates matching jobs across providers', async () => {
    stubSecrets('key-123', { appId: 'id', appKey: 'key' });
    sinon
      .stub(global, 'fetch')
      .onFirstCall()
      .resolves({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { job_id: 'j1', job_title: 'Engineer', employer_name: 'Acme' },
            ],
          }),
        text: () => Promise.resolve(''),
      })
      .onSecondCall()
      .resolves({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                id: 'a1',
                title: 'Engineer',
                company: { display_name: 'Acme' },
                location: { display_name: 'Auckland' },
              },
            ],
          }),
        text: () => Promise.resolve(''),
      });

    const resp = await handler(makeEvent('Engineer', 'Auckland'));
    const body = JSON.parse(resp.body);
    expect(body.total).to.equal(1);
    expect(body.jobs[0].source).to.equal('Seek/Adzuna');
  });

  it('retries JSearch without location when 0 results and no Adzuna', async () => {
    stubSecrets('key-123', null);
    const fetchStub = sinon
      .stub(global, 'fetch')
      .onFirstCall()
      .resolves({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
        text: () => Promise.resolve(''),
      })
      .onSecondCall()
      .resolves({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ job_id: 'j2', job_title: 'Dev', employer_name: 'Co' }],
          }),
        text: () => Promise.resolve(''),
      });

    const resp = await handler(makeEvent('Dev', 'Virginia'));
    const body = JSON.parse(resp.body);
    expect(body.total).to.equal(1);
    // Second fetch URL should embed location in query, not as separate param
    const secondUrl = fetchStub.secondCall.args[0];
    expect(secondUrl).to.include('Dev');
    expect(secondUrl).to.include('Virginia');
    expect(secondUrl).not.to.include('location=');
  });

  it('surfaces providersWarning when JSearch fails and results are empty', async () => {
    stubSecrets();
    sinon.stub(global, 'fetch').rejects(new Error('Network error'));

    const resp = await handler(makeEvent('Engineer', null));
    expect(resp.statusCode).to.equal(200);
    const body = JSON.parse(resp.body);
    expect(body.providersWarning).to.be.a('string');
    expect(body.total).to.equal(0);
  });
});
