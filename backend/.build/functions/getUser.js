"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = __importDefault(require("../utils/dynamodb"));
const errorHandler_1 = require("../utils/errorHandler");
const requestHandler_1 = require("../utils/requestHandler");
const usersTable = process.env.USERS_TABLE || 'Users';
const dynamodb = new dynamodb_1.default(usersTable);
const requestHandler = new requestHandler_1.RequestHandler('getUser');
exports.handler = requestHandler.createResponse(async (event) => {
    // Parse and validate path parameters
    const { userId } = requestHandler.parsePathParameters(event, ['userId']);
    // Validate input
    requestHandler.validateInput({ userId }, {
        userId: requestHandler_1.ValidationSchemas.user.userId,
    });
    // Get user from DynamoDB with circuit breaker protection
    const user = await dynamodb.getItem({ userId });
    if (!user) {
        throw new errorHandler_1.NotFoundError(`User with ID ${userId} not found`);
    }
    return errorHandler_1.ErrorHandler.createSuccessResponse(user);
});
