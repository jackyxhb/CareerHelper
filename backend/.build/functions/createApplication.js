"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
const errorHandler_1 = require("../utils/errorHandler");
const requestHandler_1 = require("../utils/requestHandler");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const requestHandler = new requestHandler_1.RequestHandler('createApplication');
function extractUserId(event) {
    const jwtClaims = event?.requestContext?.authorizer?.jwt?.claims ||
        event?.requestContext?.authorizer?.claims ||
        {};
    return (jwtClaims['cognito:username'] ||
        jwtClaims.sub ||
        event?.requestContext?.authorizer?.principalId ||
        event?.requestContext?.authorizer?.iam?.cognitoIdentity?.identityId ||
        null);
}
exports.handler = requestHandler.createResponse(async (event) => {
    const userId = extractUserId(event);
    if (!userId) {
        throw new errorHandler_1.UnauthorizedError('Authentication required to create application');
    }
    const payload = requestHandler.parseBody(event, ['jobId', 'status']);
    const applicationId = (0, uuid_1.v4)();
    const appliedAt = new Date().toISOString();
    const normalizedStatus = typeof payload.status === 'string'
        ? payload.status.toUpperCase()
        : payload.status;
    const applicationRecord = {
        userId,
        applicationId,
        jobId: payload.jobId,
        status: normalizedStatus,
        appliedAt,
    };
    if (payload.notes !== undefined && payload.notes !== null) {
        applicationRecord.notes = payload.notes;
    }
    if (payload.jobTitle !== undefined && payload.jobTitle !== null) {
        applicationRecord.jobTitle = payload.jobTitle;
    }
    if (payload.jobCompany !== undefined && payload.jobCompany !== null) {
        applicationRecord.jobCompany = payload.jobCompany;
    }
    if (payload.jobLocation !== undefined && payload.jobLocation !== null) {
        applicationRecord.jobLocation = payload.jobLocation;
    }
    if (payload.jobSource !== undefined && payload.jobSource !== null) {
        applicationRecord.jobSource = payload.jobSource;
    }
    requestHandler.validateInput(applicationRecord, requestHandler_1.ValidationSchemas.application);
    try {
        await documentClient.send(new lib_dynamodb_1.PutCommand({
            TableName: process.env.APPLICATIONS_TABLE,
            Item: applicationRecord,
        }));
    }
    catch (error) {
        requestHandler.logger.error('Failed to create application', {
            jobId: payload.jobId,
            status: normalizedStatus,
        }, error);
        throw error;
    }
    requestHandler.logger.info('Application created successfully', {
        applicationId,
        jobId: payload.jobId,
        status: normalizedStatus,
    });
    return errorHandler_1.ErrorHandler.createSuccessResponse({
        applicationId,
        message: 'Application created successfully',
    }, 201);
});
