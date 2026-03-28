import Logger from '../utils/logger';
import { ErrorHandler, ValidationError } from '../utils/errorHandler';
import { RequestHandler } from '../utils/requestHandler';
import { secretsManager } from '../utils/secrets';
import { APIGatewayProxyEvent } from 'aws-lambda';

const requestHandler = new RequestHandler('searchJobs');

const JSEARCH_API_URL =
  process.env.JOB_SEARCH_API_URL || 'https://jsearch.p.rapidapi.com/search';
const JSEARCH_API_HOST =
  process.env.JOB_SEARCH_API_HOST || 'jsearch.p.rapidapi.com';
const ADZUNA_API_URL =
  process.env.ADZUNA_API_URL || 'https://api.adzuna.com/v1/api/jobs';

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

interface NormalizedJob {
  jobId: string;
  title: string;
  company: string;
  location: string;
  description: string | null;
  externalUrl: string | null;
  publishedAt: string | null;
  salary: string | null;
  source: string;
}

const normalizeJSearchLocation = (job: any) => {
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.join(', ');
};

const normalizeJSearchJob = (job: any): NormalizedJob => ({
  jobId: `jsearch-${job.job_id}`,
  title: job.job_title,
  company: job.employer_name || 'Unknown Employer',
  location: normalizeJSearchLocation(job),
  description: job.job_description || null,
  externalUrl: job.job_apply_link || job.employer_website || null,
  publishedAt: job.job_posted_at_datetime_utc || null,
  salary:
    job.job_salary_currency && (job.job_min_salary || job.job_max_salary)
      ? `${job.job_salary_currency} ${job.job_min_salary ?? ''}–${job.job_max_salary ?? ''}`.trim()
      : null,
  source: 'JSearch',
});

const normalizeAdzunaJob = (job: any): NormalizedJob => ({
  jobId: `adzuna-${job.id}`,
  title: job.title,
  company: job.company?.display_name || 'Unknown Employer',
  location: job.location?.display_name || '',
  description: job.description || null,
  externalUrl: job.redirect_url || null,
  publishedAt: job.created || null,
  salary:
    job.salary_min || job.salary_max
      ? `$${Math.round(job.salary_min ?? 0).toLocaleString()}–$${Math.round(job.salary_max ?? 0).toLocaleString()}`
      : null,
  source: 'Seek/Adzuna',
});

// ---------------------------------------------------------------------------
// Location detection — determines which Adzuna country endpoint to call
// ---------------------------------------------------------------------------

const NZ_KEYWORDS = [
  'auckland',
  'wellington',
  'christchurch',
  'hamilton',
  'tauranga',
  'dunedin',
  'napier',
  'palmerston north',
  'new zealand',
  ' nz',
];
const AU_KEYWORDS = [
  'sydney',
  'melbourne',
  'brisbane',
  'perth',
  'adelaide',
  'canberra',
  'hobart',
  'darwin',
  'gold coast',
  'australia',
  ' au',
];

function detectAdzunaCountry(location: string): 'nz' | 'au' | null {
  const loc = ` ${location.toLowerCase()} `;
  if (NZ_KEYWORDS.some(k => loc.includes(k))) return 'nz';
  if (AU_KEYWORDS.some(k => loc.includes(k))) return 'au';
  return null;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchJSearch(
  query: string,
  location: string | undefined,
  apiKey: string,
  logger: Logger
): Promise<NormalizedJob[]> {
  const url = new URL(JSEARCH_API_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('page', '1');
  url.searchParams.set('num_pages', '1');
  if (location) url.searchParams.set('location', location);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': JSEARCH_API_HOST },
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error('JSearch request failed', {
      status: response.status,
      query,
      location,
      body,
    });
    throw new Error(`JSearch failed with status ${response.status}`);
  }

  const payload: any = await response.json();
  return Array.isArray(payload?.data)
    ? payload.data.map(normalizeJSearchJob)
    : [];
}

async function fetchAdzuna(
  country: 'nz' | 'au',
  query: string,
  location: string,
  appId: string,
  appKey: string,
  logger: Logger
): Promise<NormalizedJob[]> {
  const url = new URL(`${ADZUNA_API_URL}/${country}/search/1`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', '10');
  url.searchParams.set('what', query);
  url.searchParams.set('where', location);
  url.searchParams.set('content-type', 'application/json');

  const response = await fetch(url.toString(), { method: 'GET' });

  if (!response.ok) {
    const body = await response.text();
    logger.error('Adzuna request failed', {
      status: response.status,
      country,
      query,
      location,
      body,
    });
    return []; // non-fatal — degrade gracefully
  }

  const payload: any = await response.json();
  return Array.isArray(payload?.results)
    ? payload.results.map(normalizeAdzunaJob)
    : [];
}

// Deduplicate by (normalised title + company) — prefer Adzuna over JSearch for NZ/AU
function deduplicateJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = requestHandler.createResponse(
  async (event: APIGatewayProxyEvent) => {
    const logger = new Logger({
      component: 'searchJobs',
      requestId: event?.requestContext?.requestId,
    });

    const queryParams = event.queryStringParameters || {};
    const query = (queryParams.query || '').trim();
    const location = (queryParams.location || '').trim();

    if (!query) {
      throw new ValidationError('Query parameter "query" is required');
    }

    const jSearchKey = await secretsManager.getJobSearchApiKey();
    if (!jSearchKey) {
      throw new Error('Job search API key is not configured');
    }

    const adzunaCountry = location ? detectAdzunaCountry(location) : null;
    const adzunaCreds = adzunaCountry
      ? await secretsManager.getAdzunaCredentials()
      : null;

    logger.info('Starting job search', {
      query,
      location,
      providers: [
        'JSearch',
        ...(adzunaCreds ? [`Adzuna/${adzunaCountry}`] : []),
      ],
    });

    // Run JSearch + Adzuna in parallel
    const [jSearchJobs, adzunaJobs] = await Promise.all([
      fetchJSearch(query, location || undefined, jSearchKey, logger).catch(
        err => {
          logger.error('JSearch provider failed', { query, location }, err);
          return [] as NormalizedJob[];
        }
      ),
      adzunaCreds && adzunaCountry
        ? fetchAdzuna(
            adzunaCountry,
            query,
            location,
            adzunaCreds.appId,
            adzunaCreds.appKey,
            logger
          )
        : Promise.resolve([] as NormalizedJob[]),
    ]);

    // Adzuna results first (better local accuracy), then JSearch — deduplicate
    let jobs = deduplicateJobs([...adzunaJobs, ...jSearchJobs]);

    // Fallback: if JSearch returned nothing with location filter, retry without it
    if (jobs.length === 0 && location && !adzunaCreds) {
      logger.info(
        'Zero results with location filter, retrying JSearch with location in query',
        { query, location }
      );
      const retryJobs = await fetchJSearch(
        `${query} ${location}`,
        undefined,
        jSearchKey,
        logger
      ).catch(() => []);
      jobs = deduplicateJobs(retryJobs);
    }

    logger.info('Job search completed', {
      query,
      location,
      adzunaCount: adzunaJobs.length,
      jSearchCount: jSearchJobs.length,
      totalAfterDedup: jobs.length,
    });

    return ErrorHandler.createSuccessResponse({
      providers: [
        'JSearch',
        ...(adzunaCreds ? [`Adzuna/${adzunaCountry}`] : []),
      ],
      query,
      location,
      jobs,
      total: jobs.length,
    });
  }
);
