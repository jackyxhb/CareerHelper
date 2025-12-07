# CareerHelper Secrets Setup

This document explains how to set up AWS Secrets Manager and SSM Parameter Store for the CareerHelper application.

## Prerequisites

1. AWS CLI installed and configured with appropriate permissions
2. Access to AWS account with permissions to:
   - Create SSM Parameters (`ssm:PutParameter`)
   - Create Secrets Manager secrets (`secretsmanager:CreateSecret`)
   - Update Lambda functions (`lambda:UpdateFunctionConfiguration`)

## AWS CLI Configuration

If you haven't configured AWS CLI yet:

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

## Running the Setup Script

The setup script will:
1. Generate random JWT secret and API key
2. Create SSM Parameters for JWT secret and API key
3. Create a Secrets Manager secret for database credentials
4. Update Lambda environment variables to reference the secrets

```bash
# For dev environment (default)
./scripts/setup-secrets.sh

# For specific stage and region
./scripts/setup-secrets.sh prod us-west-2
```

## What Gets Created

### SSM Parameters (SecureString)
- `/careerhelper/{stage}/jwt-secret` - JWT signing secret
- `/careerhelper/{stage}/api-key` - API key for external integrations

### Secrets Manager Secrets
- `careerhelper/{stage}/database` - Database credentials (username/password)

## Next Steps

After running the setup script:

1. **Update Lambda Functions**: Modify your Lambda function code to retrieve secrets at runtime using AWS SDK instead of environment variables.

2. **Test Deployment**: Deploy your backend and verify that secrets are resolved correctly.

3. **Environment Variables**: Remove any hardcoded secrets from environment variables in `serverless.yml`.

## Example Lambda Code

```javascript
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();
const secretsManager = new AWS.SecretsManager();

async function getSecretValue() {
  const jwtSecret = await ssm.getParameter({
    Name: '/careerhelper/dev/jwt-secret',
    WithDecryption: true
  }).promise();

  const dbSecret = await secretsManager.getSecretValue({
    SecretId: 'careerhelper/dev/database'
  }).promise();

  return {
    jwtSecret: jwtSecret.Parameter.Value,
    dbCredentials: JSON.parse(dbSecret.SecretString)
  };
}
```

## Security Notes

- SSM Parameters and Secrets Manager secrets are encrypted at rest
- Access is controlled via IAM policies
- Secrets are automatically rotated if configured
- No sensitive data should remain in environment variables or code