"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const dynamodb_1 = __importDefault(require("../utils/dynamodb"));
const requestHandler_1 = require("../utils/requestHandler");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const uploadsBucket = process.env.UPLOADS_BUCKET;
const region = process.env.AWS_REGION;
const s3Client = new client_s3_1.S3Client({ region });
const resumesTable = new dynamodb_1.default(process.env.RESUMES_TABLE || 'Resumes');
const usersTable = new dynamodb_1.default(process.env.USERS_TABLE || 'Users');
const requestHandler = new requestHandler_1.RequestHandler('issueResumeUpload');
const ALLOWED_CONTENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB limit for resumes
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
function sanitizeFileName(fileName) {
    const baseName = path_1.default.basename(fileName || '').trim();
    if (!baseName) {
        throw new errorHandler_1.ValidationError('File name could not be determined');
    }
    return baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
}
exports.handler = requestHandler.createResponse(async (event) => {
    const userId = extractUserId(event);
    if (!userId) {
        throw new errorHandler_1.UnauthorizedError('Authentication required to upload a resume');
    }
    const payload = requestHandler.parseBody(event, ['fileName', 'contentType']);
    requestHandler.validateInput(payload, requestHandler_1.ValidationSchemas.resumeUpload);
    const { fileName, contentType, fileSize } = payload;
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        throw new errorHandler_1.ValidationError('Unsupported file type for resume upload');
    }
    if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
        throw new errorHandler_1.ValidationError('Resume file exceeds the 15 MB limit');
    }
    const sanitizedFileName = sanitizeFileName(fileName);
    const resumeId = (0, uuid_1.v4)();
    const objectKey = `resumes/${userId}/${resumeId}-${sanitizedFileName}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const timestamp = new Date().toISOString();
    const existingUser = await usersTable.getItem({ userId });
    if (!existingUser) {
        throw new errorHandler_1.ValidationError('Unable to locate user profile for upload');
    }
    const logger = new logger_1.default({
        component: 'issueResumeUpload',
        userId,
        resumeId,
    });
    const putCommand = new client_s3_1.PutObjectCommand({
        Bucket: uploadsBucket,
        Key: objectKey,
        ContentType: contentType,
        Metadata: {
            userId,
            fileName: sanitizedFileName,
        },
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, putCommand, {
        expiresIn: 300,
    });
    await resumesTable.putItem({
        userId,
        resumeId,
        objectKey,
        fileName: sanitizedFileName,
        contentType,
        status: 'PENDING_UPLOAD',
        createdAt: timestamp,
        updatedAt: timestamp,
        uploadExpiresAt: expiresAt,
    });
    await usersTable.updateItem({
        Key: { userId },
        UpdateExpression: 'SET resumeKey = :resumeKey, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
            ':resumeKey': objectKey,
            ':updatedAt': timestamp,
        },
    });
    logger.info('Issued pre-signed resume upload URL', {
        objectKey,
        contentType,
    });
    return errorHandler_1.ErrorHandler.createSuccessResponse({
        resumeId,
        uploadUrl,
        objectKey,
        expiresAt,
        contentType,
    });
});
