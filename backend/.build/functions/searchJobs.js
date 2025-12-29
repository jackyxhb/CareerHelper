"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("../utils/errorHandler");
const requestHandler_1 = require("../utils/requestHandler");
const secrets_1 = require("../utils/secrets");
const requestHandler = new requestHandler_1.RequestHandler('searchJobs');
// Native fetch is available in Node 18
const DEFAULT_API_URL = process.env.JOB_SEARCH_API_URL || 'https://jsearch.p.rapidapi.com/search';
const DEFAULT_API_HOST = process.env.JOB_SEARCH_API_HOST || 'jsearch.p.rapidapi.com';
const normalizeLocation = (job) => {
    const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
    return parts.join(', ');
};
const normalizeJob = (job) => ({
    jobId: `external-${job.job_id}`,
    title: job.job_title,
    company: job.employer_name || 'Unknown Employer',
    location: normalizeLocation(job),
    description: job.job_description,
    externalUrl: job.job_apply_link || job.job_apply_is_direct || job.employer_website || null,
    publishedAt: job.job_posted_at_datetime_utc,
    salary: job.job_salary_currency && (job.job_min_salary || job.job_max_salary)
        ? {
            currency: job.job_salary_currency,
            min: job.job_min_salary,
            max: job.job_max_salary,
        }
        : null,
    source: 'JSearch',
});
exports.handler = requestHandler.createResponse(async (event) => {
    const logger = new logger_1.default({ component: 'searchJobs', requestId: event?.requestContext?.requestId });
    const queryParams = event.queryStringParameters || {};
    const query = (queryParams.query || '').trim();
    const location = (queryParams.location || '').trim();
    if (!query) {
        throw new errorHandler_1.ValidationError('Query parameter "query" is required');
    }
    const apiKey = await secrets_1.secretsManager.getJobSearchApiKey();
    if (!apiKey) {
        throw new Error('Job search API key is not configured');
    }
    const url = new URL(DEFAULT_API_URL);
    url.searchParams.set('query', query);
    url.searchParams.set('page', '1');
    url.searchParams.set('num_pages', '1');
    if (location) {
        url.searchParams.set('location', location);
    }
    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': DEFAULT_API_HOST,
            },
        });
        if (!response.ok) {
            const errorBody = await response.text();
            logger.error('External job search request failed', {
                status: response.status,
                statusText: response.statusText,
                query,
                location,
                gatewayResponse: errorBody,
            });
            throw new Error(`External job search failed with status ${response.status}`);
        }
        const payload = await response.json();
        const externalJobs = Array.isArray(payload?.data)
            ? payload.data.map(normalizeJob)
            : [];
        logger.info('External job search completed', {
            query,
            location,
            returned: externalJobs.length,
        });
        return errorHandler_1.ErrorHandler.createSuccessResponse({
            provider: 'JSearch',
            query,
            location,
            jobs: externalJobs,
            total: payload?.total_jobs ?? externalJobs.length,
        });
    }
    catch (error) {
        logger.error('Failed to execute external job search', { query, location }, error);
        throw error;
    }
});
