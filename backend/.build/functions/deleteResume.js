"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const dynamodb_1 = __importDefault(require("../utils/dynamodb"));
const requestHandler_1 = require("../utils/requestHandler");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const uploadsBucket = process.env.UPLOADS_BUCKET;
const region = process.env.AWS_REGION;
const s3Client = new client_s3_1.S3Client({ region });
const resumesTable = new dynamodb_1.default(process.env.RESUMES_TABLE || 'Resumes');
const usersTable = new dynamodb_1.default(process.env.USERS_TABLE || 'Users');
const requestHandler = new requestHandler_1.RequestHandler('deleteResume');
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
        throw new errorHandler_1.UnauthorizedError('Authentication required to delete resumes');
    }
    const { resumeId } = requestHandler.parsePathParameters(event, ['resumeId']);
    const logger = new logger_1.default({ component: 'deleteResume', userId, resumeId });
    const resumeItem = await resumesTable.getItem({ userId, resumeId });
    if (!resumeItem) {
        throw new errorHandler_1.NotFoundError('Resume not found for the current user');
    }
    await s3Client.send(new client_s3_1.DeleteObjectCommand({
        Bucket: uploadsBucket,
        Key: resumeItem.objectKey,
    }));
    await resumesTable.deleteItem({ userId, resumeId });
    const userProfile = await usersTable.getItem({ userId });
    if (userProfile?.resumeKey === resumeItem.objectKey) {
        await usersTable.updateItem({
            Key: { userId },
            UpdateExpression: 'REMOVE resumeKey SET updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':updatedAt': new Date().toISOString(),
            },
        });
    }
    logger.info('Deleted resume and metadata', {
        objectKey: resumeItem.objectKey,
    });
    return errorHandler_1.ErrorHandler.createSuccessResponse({ success: true });
});
