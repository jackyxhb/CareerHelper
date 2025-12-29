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
const requestHandler = new requestHandler_1.RequestHandler('createJob');
exports.handler = requestHandler.createResponse(async (event) => {
    const payload = requestHandler.parseBody(event, ['title', 'company']);
    const jobId = (0, uuid_1.v4)();
    const postedAt = new Date().toISOString();
    const jobRecord = {
        jobId,
        title: payload.title,
        company: payload.company,
        postedAt,
    };
    if (payload.location !== undefined && payload.location !== null) {
        jobRecord.location = payload.location;
    }
    if (payload.description !== undefined && payload.description !== null) {
        jobRecord.description = payload.description;
    }
    if (payload.salary !== undefined && payload.salary !== null) {
        jobRecord.salary = payload.salary;
    }
    requestHandler.validateInput(jobRecord, requestHandler_1.ValidationSchemas.job);
    try {
        await documentClient.send(new lib_dynamodb_1.PutCommand({
            TableName: process.env.JOBS_TABLE,
            Item: jobRecord,
        }));
    }
    catch (error) {
        requestHandler.logger.error('Failed to create job', {
            company: payload.company,
            location: payload.location,
            hasSalary: payload.salary !== undefined,
        }, error);
        throw error;
    }
    requestHandler.logger.info('Job created successfully', {
        jobId,
        company: payload.company,
        location: payload.location,
    });
    return errorHandler_1.ErrorHandler.createSuccessResponse({ jobId, message: 'Job created successfully' }, 201);
});
