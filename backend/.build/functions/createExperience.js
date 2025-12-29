"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("../utils/errorHandler");
const handler = async (event) => {
    const body = event.body ? JSON.parse(event.body) : {};
    const { userId, title, company, startDate, endDate, description } = body;
    const logger = new logger_1.default({
        component: 'createExperience',
        requestId: event?.requestContext?.requestId,
        userId,
    });
    const client = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION });
    const dynamodb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    const experienceId = (0, uuid_1.v4)();
    const params = {
        TableName: process.env.EXPERIENCES_TABLE,
        Item: {
            userId,
            experienceId,
            title,
            company,
            startDate,
            endDate,
            description,
        },
    };
    try {
        await dynamodb.send(new lib_dynamodb_1.PutCommand(params));
        logger.info('Experience created successfully', {
            experienceId,
            company,
            title,
        });
        return errorHandler_1.ErrorHandler.createSuccessResponse({
            experienceId,
            message: 'Experience created successfully',
        }, 201);
    }
    catch (error) {
        logger.error('Failed to create experience', { company, title, hasEndDate: Boolean(endDate) }, error);
        return errorHandler_1.ErrorHandler.createErrorResponse(error, {
            component: 'createExperience',
            requestId: event?.requestContext?.requestId,
            userId,
        });
    }
};
exports.handler = handler;
