import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '../utils/Logger';
import { ErrorHandler, ErrorResponse } from '../utils/ErrorHandler';
import { RequestHandler } from '../utils/RequestHandler';

const logger = new Logger('pmfSurvey');

interface PMFResponse {
  userId: string;
  score: number;
  feedback?: string;
  useCase?: string;
  improvements?: string[];
  wouldRefer?: boolean;
  timestamp: string;
}

const PMF_THRESHOLDS = {
  DETRACTOR: 6,
  PASSIVE: 8,
  PROMOTER: 10,
};

const USE_CASES = [
  'Job Application Tracking',
  'Resume Building',
  'Interview Preparation',
  'Career Planning',
  'Skill Assessment',
  'Network Building',
  'Salary Negotiation',
  'Other',
];

const IMPROVEMENTS = [
  'Better job search features',
  'More integrations (LinkedIn, Indeed)',
  'Improved mobile experience',
  'AI-powered recommendations',
  'Interview preparation tools',
  'Better analytics',
  'Faster performance',
  'Other',
];

export async function handler(
  event: APIGatewayProxyEvent,
  context: { functionName: string }
): Promise<APIGatewayProxyResult | ErrorResponse> {
  const requestId = context.functionName;

  try {
    if (event.httpMethod === 'POST') {
      return handleSubmit(event, requestId);
    } else if (event.httpMethod === 'GET') {
      return handleGetStats(event, requestId);
    }

    return ErrorHandler.createErrorResponse(
      405,
      'Method Not Allowed',
      'This endpoint supports GET and POST only',
      requestId
    );
  } catch (error) {
    logger.error('Error in PMF survey handler', error as Error, { requestId });
    return ErrorHandler.createErrorResponse(
      500,
      'Internal Server Error',
      'Failed to process PMF survey',
      requestId
    );
  }
}

async function handleSubmit(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult | ErrorResponse> {
  const body = RequestHandler.parseBody<PMFResponse>(event.body);

  if (!body.userId || body.score === undefined) {
    return ErrorHandler.createErrorResponse(
      400,
      'Bad Request',
      'userId and score are required',
      requestId
    );
  }

  if (body.score < 0 || body.score > 10) {
    return ErrorHandler.createErrorResponse(
      400,
      'Bad Request',
      'Score must be between 0 and 10',
      requestId
    );
  }

  const response: PMFResponse = {
    userId: body.userId,
    score: body.score,
    feedback: body.feedback,
    useCase: body.useCase,
    improvements: body.improvements,
    wouldRefer: body.wouldRefer,
    timestamp: new Date().toISOString(),
  };

  const category = getCategory(response.score);

  logger.info('PMF survey submitted', {
    userId: response.userId,
    score: response.score,
    category,
    requestId,
  });

  const message =
    category === 'Promoter'
      ? 'Thank you for your positive feedback!'
      : category === 'Passive'
        ? "Thank you for your feedback. We'll work to improve."
        : "Thank you for your feedback. We're committed to making CareerHelper better.";

  return {
    statusCode: 200,
    headers: RequestHandler.corsHeaders,
    body: JSON.stringify({
      success: true,
      category,
      message,
      stats: await calculateStats(),
    }),
  };
}

async function handleGetStats(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult | ErrorResponse> {
  const stats = await calculateStats();

  return {
    statusCode: 200,
    headers: RequestHandler.corsHeaders,
    body: JSON.stringify(stats),
  };
}

function getCategory(score: number): 'Promoter' | 'Passive' | 'Detractor' {
  if (score >= PMF_THRESHOLDS.PROMOTER) return 'Promoter';
  if (score >= PMF_THRESHOLDS.PASSIVE) return 'Passive';
  return 'Detractor';
}

async function calculateStats(): Promise<{
  responseCount: number;
  averageScore: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
}> {
  return {
    responseCount: 0,
    averageScore: 0,
    npsScore: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
  };
}
