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
const handler = async () => {
    const logger = new logger_1.default({ component: 'getJobs' });
    const client = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION });
    const dynamodb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    const params = {
        TableName: process.env.JOBS_TABLE,
    };
    try {
        const result = await dynamodb.send(new lib_dynamodb_1.ScanCommand(params));
        logger.info('Jobs retrieved successfully', {
            items: result.Items?.length || 0,
        });
        return errorHandler_1.ErrorHandler.createSuccessResponse(result.Items || []);
    }
    catch (error) {
        logger.error('Failed to retrieve jobs', {}, error);
        return errorHandler_1.ErrorHandler.createErrorResponse(error, {
            component: 'getJobs',
        });
    }
};
exports.handler = handler;
