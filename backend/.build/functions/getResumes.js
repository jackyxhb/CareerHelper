"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const dynamodb_1 = __importDefault(require("../utils/dynamodb"));
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const requestHandler_1 = require("../utils/requestHandler");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const uploadsBucket = process.env.UPLOADS_BUCKET;
const region = process.env.AWS_REGION;
const s3Client = new client_s3_1.S3Client({ region });
const resumesTable = new dynamodb_1.default(process.env.RESUMES_TABLE || 'Resumes');
const requestHandler = new requestHandler_1.RequestHandler('getResumes');
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
        throw new errorHandler_1.UnauthorizedError('Authentication required to view resumes');
    }
    const logger = new logger_1.default({ component: 'getResumes', userId });
    const items = await resumesTable.queryItems({
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId,
        },
    });
    const responseItems = [];
    for (const item of items) {
        try {
            const downloadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
                Bucket: uploadsBucket,
                Key: item.objectKey,
            }), { expiresIn: 300 });
            responseItems.push({
                resumeId: item.resumeId,
                fileName: item.fileName,
                contentType: item.contentType,
                objectKey: item.objectKey,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                downloadUrl,
            });
        }
        catch (error) {
            logger.warn('Failed to generate resume download URL', {
                resumeId: item.resumeId,
                objectKey: item.objectKey,
            }, error);
            responseItems.push({
                resumeId: item.resumeId,
                fileName: item.fileName,
                contentType: item.contentType,
                objectKey: item.objectKey,
                status: 'MISSING_ASSET',
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                downloadUrl: null,
            });
        }
    }
    logger.info('Fetched resume metadata', {
        count: responseItems.length,
    });
    return errorHandler_1.ErrorHandler.createSuccessResponse({ resumes: responseItems });
});
