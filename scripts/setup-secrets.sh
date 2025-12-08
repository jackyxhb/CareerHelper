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
echo "Creating or updating Secrets Manager secret..."
SECRET_EXISTS=$(aws secretsmanager describe-secret --secret-id "careerhelper/${STAGE}/database" --region "${REGION}" --query 'ARN' --output text 2>/dev/null || echo "")

if [ -z "$SECRET_EXISTS" ]; then
  SECRET_ARN=$(aws secretsmanager create-secret \
    --name "careerhelper/${STAGE}/database" \
    --description "Database credentials for CareerHelper" \
    --secret-string "{\"username\":\"careerhelper\",\"password\":\"$(openssl rand -hex 16)\"}" \
    --region "${REGION}" \
    --query 'ARN' \
    --output text)
  echo "Created secret: ${SECRET_ARN}"
else
  aws secretsmanager update-secret \
    --secret-id "careerhelper/${STAGE}/database" \
    --secret-string "{\"username\":\"careerhelper\",\"password\":\"$(openssl rand -hex 16)\"}" \
    --region "${REGION}"
  SECRET_ARN=$SECRET_EXISTS
  echo "Updated existing secret: ${SECRET_ARN}"
fi

echo "Secrets setup complete!"
echo ""
echo "Summary:"
echo "- JWT Secret SSM Parameter: /careerhelper/${STAGE}/jwt-secret"
echo "- API Key SSM Parameter: /careerhelper/${STAGE}/api-key"
echo "- Database Secret: ${SECRET_ARN}"
echo ""
echo "Make sure to update your application code to retrieve these values at runtime instead of using environment variables."