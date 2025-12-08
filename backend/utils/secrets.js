const {
  SSMClient,
  GetParameterCommand,
} = require('@aws-sdk/client-ssm');
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const Logger = require('./logger');

class SecretsManager {
  constructor() {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    this.ssm = new SSMClient({ region });
    this.secretsManager = new SecretsManagerClient({ region });
    this.cache = new Map();
    this.logger = new Logger({ component: 'SecretsManager' });
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
      const response = await this.ssm.send(
        new GetParameterCommand({
          Name: name,
          WithDecryption: true,
        })
      );

      const value = response.Parameter.Value;
      this.cache.set(cacheKey, value);
      return value;
    } catch (error) {
      this.logger.error('Failed to retrieve SSM parameter', { name }, error);
      throw error;
    }
  }

  /**
   * Get Secrets Manager secret value
   * @param {string} secretId - Secret ID or ARN
   * @returns {Promise<object>} Parsed secret value
   */
  async getSecretValue(secretId) {
    const cacheKey = `secret:${secretId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.secretsManager.send(
        new GetSecretValueCommand({
          SecretId: secretId,
        })
      );

      const secretString = response.SecretString;
      const value = JSON.parse(secretString);
      this.cache.set(cacheKey, value);
      return value;
    } catch (error) {
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
   * @returns {Promise<object>} Database credentials
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

// Export singleton instance
const secretsManager = new SecretsManager();

module.exports = {
  SecretsManager,
  secretsManager,
};
