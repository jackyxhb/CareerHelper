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
const requestHandler = new requestHandler_1.RequestHandler('health');
exports.handler = requestHandler.createResponse(async () => {
    // Check DynamoDB connectivity by attempting to scan users table
    try {
        await dynamodb.scanItems({ Limit: 1 });
    }
    catch (error) {
        throw new Error(`Database health check failed: ${error.message}`);
    }
    // Get circuit breaker status
    const circuitBreakerStatus = dynamodb.getCircuitBreakerStatus();
    return errorHandler_1.ErrorHandler.createSuccessResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'CareerHelper API',
        version: '0.0.1',
        checks: {
            dynamodb: 'ok',
            circuitBreaker: circuitBreakerStatus.state.toLowerCase(),
        },
        metrics: {
            circuitBreaker: circuitBreakerStatus,
        },
    });
});
