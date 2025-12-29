"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretsManager = exports.SecretsManager = void 0;
const client_ssm_1 = require("@aws-sdk/client-ssm");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const logger_1 = __importDefault(require("./logger"));
class SecretsManager {
    ssm;
    secretsManager;
    cache;
    logger;
    constructor() {
        const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
        this.ssm = new client_ssm_1.SSMClient({ region });
        this.secretsManager = new client_secrets_manager_1.SecretsManagerClient({ region });
        this.cache = new Map();
        this.logger = new logger_1.default({ component: 'SecretsManager' });
    }
    /**
     * Get SSM parameter value
     * @param {string} name - Parameter name (without leading slash for hierarchical parameters)
     * @returns {Promise<string>} Parameter value
     */
    async getSSMParameter(name) {
        const cacheKey = `ssm:${name}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        try {
            const response = await this.ssm.send(new client_ssm_1.GetParameterCommand({
                Name: name,
                WithDecryption: true,
            }));
            const value = response.Parameter?.Value || '';
            this.cache.set(cacheKey, value);
            return value;
        }
        catch (error) {
            this.logger.error('Failed to retrieve SSM parameter', { name }, error);
            throw error;
        }
    }
    /**
     * Get Secrets Manager secret value
     * @param {string} secretId - Secret ID or ARN
     * @returns {Promise<any>} Parsed secret value
     */
    async getSecretValue(secretId) {
        const cacheKey = `secret:${secretId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        try {
            const response = await this.secretsManager.send(new client_secrets_manager_1.GetSecretValueCommand({
                SecretId: secretId,
            }));
            const secretString = response.SecretString;
            if (!secretString) {
                throw new Error('SecretString is missing');
            }
            const value = JSON.parse(secretString);
            this.cache.set(cacheKey, value);
            return value;
        }
        catch (error) {
            this.logger.error('Failed to retrieve secret', { secretId }, error);
            throw error;
        }
    }
    /**
     * Get JWT secret for the current stage
     * @param {string} stage - Deployment stage (dev, prod, etc.)
     * @returns {Promise<string>} JWT secret
     */
    async getJWTSecret(stage = process.env.STAGE || 'dev') {
        const paramName = `/careerhelper/${stage}/jwt-secret`;
        return this.getSSMParameter(paramName);
    }
    /**
     * Get API key for the current stage
     * @param {string} stage - Deployment stage (dev, prod, etc.)
     * @returns {Promise<string>} API key
     */
    async getAPIKey(stage = process.env.STAGE || 'dev') {
        const paramName = `/careerhelper/${stage}/api-key`;
        return this.getSSMParameter(paramName);
    }
    /**
     * Get external job search API key for the current stage
     * @param {string} stage
     * @returns {Promise<string>}
     */
    async getJobSearchApiKey(stage = process.env.STAGE || 'dev') {
        const paramName = `/careerhelper/${stage}/job-search-api-key`;
        return this.getSSMParameter(paramName);
    }
    /**
     * Get database credentials for the current stage
     * @param {string} stage - Deployment stage (dev, prod, etc.)
     * @returns {Promise<any>} Database credentials
     */
    async getDatabaseCredentials(stage = process.env.STAGE || 'dev') {
        const secretId = `careerhelper/${stage}/database`;
        return this.getSecretValue(secretId);
    }
    /**
     * Clear cache (useful for testing or when secrets are rotated)
     */
    clearCache() {
        this.cache.clear();
    }
}
exports.SecretsManager = SecretsManager;
// Export singleton instance
exports.secretsManager = new SecretsManager();
