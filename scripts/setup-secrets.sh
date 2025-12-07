#!/bin/bash

# CareerHelper Secrets Setup Script
# This script sets up AWS Secrets Manager and SSM Parameter Store for the CareerHelper application

set -e

# Configuration
STAGE=${1:-dev}
REGION=${2:-$(aws configure get region)}
STACK_NAME="careerhelper-infrastructure-${STAGE}"

echo "Setting up secrets for CareerHelper (${STAGE}) in region ${REGION}"

# Generate random secrets
JWT_SECRET=$(openssl rand -hex 32)
API_KEY=$(openssl rand -hex 16)

echo "Generated JWT_SECRET: ${JWT_SECRET}"
echo "Generated API_KEY: ${API_KEY}"

# Create SSM Parameters (for non-sensitive config that might change frequently)
echo "Creating SSM Parameters..."
aws ssm put-parameter \
  --name "/careerhelper/${STAGE}/jwt-secret" \
  --value "${JWT_SECRET}" \
  --type "SecureString" \
  --description "JWT signing secret for CareerHelper API" \
  --region "${REGION}" \
  --overwrite

aws ssm put-parameter \
  --name "/careerhelper/${STAGE}/api-key" \
  --value "${API_KEY}" \
  --type "SecureString" \
  --description "API key for CareerHelper external integrations" \
  --region "${REGION}" \
  --overwrite

# Create Secrets Manager secret (for sensitive config)
echo "Creating Secrets Manager secret..."
SECRET_ARN=$(aws secretsmanager create-secret \
  --name "careerhelper/${STAGE}/database" \
  --description "Database credentials for CareerHelper" \
  --secret-string "{\"username\":\"careerhelper\",\"password\":\"$(openssl rand -hex 16)\"}" \
  --region "${REGION}" \
  --query 'ARN' \
  --output text)

echo "Created secret: ${SECRET_ARN}"

# Update Lambda environment variables to include secret references
echo "Updating Lambda environment variables..."
aws lambda update-function-configuration \
  --function-name "careerhelper-backend-${STAGE}-getUser" \
  --environment "Variables={USERS_TABLE=careerhelper-users-${STAGE},JWT_SECRET=/careerhelper/${STAGE}/jwt-secret}" \
  --region "${REGION}"

echo "Secrets setup complete!"
echo ""
echo "Summary:"
echo "- JWT Secret SSM Parameter: /careerhelper/${STAGE}/jwt-secret"
echo "- API Key SSM Parameter: /careerhelper/${STAGE}/api-key"
echo "- Database Secret: ${SECRET_ARN}"
echo ""
echo "Make sure to update your application code to retrieve these values at runtime instead of using environment variables."