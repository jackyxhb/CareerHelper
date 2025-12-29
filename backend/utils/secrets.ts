import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import Logger from './logger';

export class SecretsManager {
  private ssm: SSMClient;
  private secretsManager: SecretsManagerClient;
  private cache: Map<string, any>;
  private logger: Logger;

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
  async getSSMParameter(name: string): Promise<string> {
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

      const value = response.Parameter?.Value || '';
      this.cache.set(cacheKey, value);
      return value;
    } catch (error: any) {
      this.logger.error('Failed to retrieve SSM parameter', { name }, error);
      throw error;
    }
  }

  /**
   * Get Secrets Manager secret value
   * @param {string} secretId - Secret ID or ARN
   * @returns {Promise<any>} Parsed secret value
   */
  async getSecretValue(secretId: string): Promise<any> {
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
      if (!secretString) {
        throw new Error('SecretString is missing');
      }

      const value = JSON.parse(secretString);
      this.cache.set(cacheKey, value);
      return value;
    } catch (error: any) {
      this.logger.error('Failed to retrieve secret', { secretId }, error);
      throw error;
    }
  }

  /**
   * Get JWT secret for the current stage
   * @param {string} stage - Deployment stage (dev, prod, etc.)
   * @returns {Promise<string>} JWT secret
   */
  async getJWTSecret(stage: string = process.env.STAGE || 'dev'): Promise<string> {
    const paramName = `/careerhelper/${stage}/jwt-secret`;
    return this.getSSMParameter(paramName);
  }

  /**
   * Get API key for the current stage
   * @param {string} stage - Deployment stage (dev, prod, etc.)
   * @returns {Promise<string>} API key
   */
  async getAPIKey(stage: string = process.env.STAGE || 'dev'): Promise<string> {
    const paramName = `/careerhelper/${stage}/api-key`;
    return this.getSSMParameter(paramName);
  }

  /**
   * Get external job search API key for the current stage
   * @param {string} stage
   * @returns {Promise<string>}
   */
  async getJobSearchApiKey(stage: string = process.env.STAGE || 'dev'): Promise<string> {
    const paramName = `/careerhelper/${stage}/job-search-api-key`;
    return this.getSSMParameter(paramName);
  }

  /**
   * Get database credentials for the current stage
   * @param {string} stage - Deployment stage (dev, prod, etc.)
   * @returns {Promise<any>} Database credentials
   */
  async getDatabaseCredentials(stage: string = process.env.STAGE || 'dev'): Promise<any> {
    const secretId = `careerhelper/${stage}/database`;
    return this.getSecretValue(secretId);
  }

  /**
   * Clear cache (useful for testing or when secrets are rotated)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const secretsManager = new SecretsManager();
