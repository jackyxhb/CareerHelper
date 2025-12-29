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
const requestHandler = new requestHandler_1.RequestHandler('createUser');
exports.handler = requestHandler.createResponse(async (event) => {
    // Parse and validate request body
    const userData = requestHandler.parseBody(event, ['userId', 'email', 'name']);
    // Validate input against schema
    requestHandler.validateInput(userData, requestHandler_1.ValidationSchemas.user);
    // Check if user already exists
    const existingUser = await dynamodb.getItem({ userId: userData.userId });
    if (existingUser) {
        throw new errorHandler_1.ConflictError(`User with ID ${userData.userId} already exists`);
    }
    // Prepare user item
    const userItem = {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    // Save user to DynamoDB with circuit breaker protection
    await dynamodb.putItem(userItem);
    return errorHandler_1.ErrorHandler.createSuccessResponse({ message: 'User created successfully', userId: userData.userId }, 201);
});
