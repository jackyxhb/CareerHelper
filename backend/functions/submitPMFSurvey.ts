import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Logger from '../utils/logger';
import { ErrorHandler, ApiErrorResponse } from '../utils/errorHandler';
import { RequestHandler } from '../utils/requestHandler';

const logger = new Logger({ function: 'submitPMFSurvey' });

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

export const handler = async (
  event: APIGatewayProxyEvent,
  context: { functionName: string }
): Promise<APIGatewayProxyResult | ApiErrorResponse> => {
  const requestId = context.functionName;
  const requestHandler = new RequestHandler('submitPMFSurvey', { requestId });

  try {
    if (event.httpMethod === 'POST') {
      return handleSubmit(event, requestHandler, requestId);
    } else if (event.httpMethod === 'GET') {
      return handleGetStats(requestId);
    }

    return ErrorHandler.createErrorResponse(
      {
        name: 'ValidationError',
        message: 'This endpoint supports GET and POST only',
      },
      { requestId }
    );
  } catch (error) {
    logger.error('Error in PMF survey handler', { error }, error as Error);
    return ErrorHandler.createErrorResponse(error as Error, { requestId });
  }
};

function handleSubmit(
  event: APIGatewayProxyEvent,
  requestHandler: RequestHandler,
  requestId: string
): ApiErrorResponse | Promise<APIGatewayProxyResult> {
  const body = requestHandler.parseBody<PMFResponse>(event, ['userId']);

  if (body.score === undefined || body.score === null) {
    return ErrorHandler.createErrorResponse(
      { name: 'ValidationError', message: 'score is required' },
      { requestId }
    );
  }

  if (body.score < 0 || body.score > 10) {
    return ErrorHandler.createErrorResponse(
      { name: 'ValidationError', message: 'Score must be between 0 and 10' },
      { requestId }
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

  return ErrorHandler.createSuccessResponse({
    success: true,
    category,
    message,
    stats: {
      responseCount: 1,
      averageScore: response.score,
    },
  });
}

function handleGetStats(requestId: string): ApiErrorResponse {
  return ErrorHandler.createSuccessResponse({
    responseCount: 0,
    averageScore: 0,
    npsScore: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
  });
}

function getCategory(score: number): 'Promoter' | 'Passive' | 'Detractor' {
  if (score >= PMF_THRESHOLDS.PROMOTER) return 'Promoter';
  if (score >= PMF_THRESHOLDS.PASSIVE) return 'Passive';
  return 'Detractor';
}
