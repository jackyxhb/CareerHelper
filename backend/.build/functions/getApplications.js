"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("../utils/errorHandler");
const handler = async (event) => {
    const { userId } = event.pathParameters || {};
    if (!userId) {
        return errorHandler_1.ErrorHandler.createErrorResponse(new Error('Missing userId'), {
            component: 'getApplications',
            requestId: event?.requestContext?.requestId,
        });
    }
    const logger = new logger_1.default({
        component: 'getApplications',
        requestId: event?.requestContext?.requestId,
        userId,
    });
    const client = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION });
    const dynamodb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    const params = {
        TableName: process.env.APPLICATIONS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId,
        },
    };
    try {
        const result = await dynamodb.send(new lib_dynamodb_1.QueryCommand(params));
        logger.info('Applications retrieved successfully', {
            items: result.Items?.length || 0,
        });
        return errorHandler_1.ErrorHandler.createSuccessResponse(result.Items || []);
    }
    catch (error) {
        logger.error('Failed to retrieve applications', {}, error);
        return errorHandler_1.ErrorHandler.createErrorResponse(error, {
            component: 'getApplications',
            requestId: event?.requestContext?.requestId,
            userId,
        });
    }
};
exports.handler = handler;
