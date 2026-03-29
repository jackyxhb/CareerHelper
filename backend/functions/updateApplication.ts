import DynamoDBUtil from '../utils/dynamodb';
import {
  ErrorHandler,
  NotFoundError,
  ValidationError,
} from '../utils/errorHandler';
import { RequestHandler, ValidationSchemas } from '../utils/requestHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';

const applicationsTable = process.env.APPLICATIONS_TABLE || 'Applications';
const dynamodb = new DynamoDBUtil(applicationsTable);
const requestHandler = new RequestHandler('updateApplication');

const TERMINAL_STATUSES = [
  'APPLIED',
  'INTERVIEWING',
  'OFFERED',
  'REJECTED',
  'WITHDRAWN',
];

export const handler = requestHandler.createResponse(
  async (event: APIGatewayProxyEvent) => {
    const { userId, applicationId } = requestHandler.parsePathParameters(
      event,
      ['userId', 'applicationId']
    );

    const body = requestHandler.parseBody<{
      status?: string;
      notes?: string;
      appliedAt?: string;
    }>(event);

    // Validate status if provided
    if (body.status !== undefined) {
      requestHandler.validateInput(
        { status: body.status },
        {
          status: ValidationSchemas.application.status,
        }
      );
    } else {
      throw new ValidationError('status field is required');
    }

    // Validate optional fields
    if (body.notes !== undefined && typeof body.notes !== 'string') {
      throw new ValidationError('notes must be a string');
    }
    if (body.appliedAt !== undefined && typeof body.appliedAt !== 'string') {
      throw new ValidationError('appliedAt must be a string');
    }

    // Fetch existing application
    const existing = await dynamodb.getItem({ userId, applicationId });
    if (!existing) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }

    // Enforce state transition guard: cannot revert from terminal status to SAVED
    if (
      TERMINAL_STATUSES.includes(existing.status) &&
      body.status === 'SAVED'
    ) {
      throw new ValidationError('Cannot revert applied job to saved state');
    }

    // Build UpdateExpression from provided fields
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.appliedAt !== undefined) updates.appliedAt = body.appliedAt;

    const setExpressions: string[] = [];
    const ExpressionAttributeNames: Record<string, string> = {};
    const ExpressionAttributeValues: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(updates)) {
      setExpressions.push(`#${field} = :${field}`);
      ExpressionAttributeNames[`#${field}`] = field;
      ExpressionAttributeValues[`:${field}`] = value;
    }

    await dynamodb.updateItem({
      Key: { userId, applicationId },
      UpdateExpression: `SET ${setExpressions.join(', ')}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    return ErrorHandler.createSuccessResponse({
      message: 'Application updated',
      userId,
      applicationId,
    });
  }
);
