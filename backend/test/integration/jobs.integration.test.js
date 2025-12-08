const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const getJobs = require('../../functions/getJobs');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('Jobs API integration', () => {
  before(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.JOBS_TABLE = 'jobs-table';
  });

  beforeEach(() => {
    dynamoMock.reset();
  });

  it('returns jobs from the table', async () => {
    const jobs = [
      { jobId: 'job-1', title: 'Senior Engineer' },
      { jobId: 'job-2', title: 'Product Manager' },
    ];

    dynamoMock.on(ScanCommand).resolves({ Items: jobs });

    const response = await getJobs.handler({
      requestContext: { requestId: 'req-3' },
    });

    expect(response.statusCode).to.equal(200);
    const body = JSON.parse(response.body);
    expect(body).to.deep.equal(jobs);
  });
});
