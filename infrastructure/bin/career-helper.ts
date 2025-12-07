#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CareerHelperStack } from '../lib/career-helper-stack';

const app = new cdk.App();
new CareerHelperStack(app, 'CareerHelperStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
