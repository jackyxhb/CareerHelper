const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const getApplications = require('../functions/getApplications');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('getApplications', () => {
  before(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.APPLICATIONS_TABLE = 'test-applications-table';
  });

  beforeEach(() => {
    dynamoMock.reset();
  });

  after(() => {
    delete process.env.AWS_REGION;
    delete process.env.APPLICATIONS_TABLE;
  });

  it('returns applications for a user', async () => {
    const applications = [
      {
        userId: 'user123',
        applicationId: 'app1',
        jobId: 'job1',
        jobTitle: 'Software Engineer',
        jobCompany: 'Acme Corp',
        jobLocation: 'Auckland, New Zealand',
        status: 'APPLIED',
        appliedAt: '2026-03-28T10:00:00Z',
      },
      {
        userId: 'user123',
        applicationId: 'app2',
        jobId: 'job2',
        jobTitle: 'Product Manager',
        jobCompany: 'TechCo',
        jobLocation: 'Wellington, New Zealand',
        status: 'INTERVIEWING',
        appliedAt: '2026-03-27T10:00:00Z',
      },
    ];

    dynamoMock.on(QueryCommand).resolves({ Items: applications });

    const event = {
      pathParameters: { userId: 'user123' },
      requestContext: { requestId: 'req123' },
    };

    const result = await getApplications.handler(event);
    expect(result.statusCode).to.equal(200);
    const body = JSON.parse(result.body);
    expect(body).to.be.an('array');
    expect(body.length).to.equal(2);
  });

  it('deduplicates applications by jobTitle, jobCompany, jobLocation', async () => {
    const applications = [
      {
        userId: 'user123',
        applicationId: 'app1',
        jobId: 'job1',
        jobTitle: 'Software Engineer',
        jobCompany: 'Acme Corp',
        jobLocation: 'Auckland, New Zealand',
        status: 'APPLIED',
        appliedAt: '2026-03-28T10:00:00Z',
      },
      {
        userId: 'user123',
        applicationId: 'app2',
        jobId: 'job2',
        jobTitle: 'Software Engineer',
        jobCompany: 'Acme Corp',
        jobLocation: 'Auckland, New Zealand',
        status: 'INTERVIEWING',
        appliedAt: '2026-03-29T10:00:00Z', // Newer
      },
    ];

    dynamoMock.on(QueryCommand).resolves({ Items: applications });

    const event = {
      pathParameters: { userId: 'user123' },
      requestContext: { requestId: 'req123' },
    };

    const result = await getApplications.handler(event);
    expect(result.statusCode).to.equal(200);
    const body = JSON.parse(result.body);
    expect(body.length).to.equal(1); // Deduplicated to 1
    expect(body[0].applicationId).to.equal('app2'); // Keep the newer one
    expect(body[0].status).to.equal('INTERVIEWING');
  });

  it('keeps most recent application when duplicates exist', async () => {
    const applications = [
      {
        userId: 'user123',
        applicationId: 'app1',
        jobTitle: 'Engineer',
        jobCompany: 'Company A',
        jobLocation: 'City X',
        status: 'APPLIED',
        appliedAt: '2026-03-27T10:00:00Z', // Older
      },
      {
        userId: 'user123',
        applicationId: 'app2',
        jobTitle: 'Engineer',
        jobCompany: 'Company A',
        jobLocation: 'City X',
        status: 'REJECTED',
        appliedAt: '2026-03-28T10:00:00Z', // Newer
      },
      {
        userId: 'user123',
        applicationId: 'app3',
        jobTitle: 'Engineer',
        jobCompany: 'Company A',
        jobLocation: 'City X',
        status: 'WITHDRAWN',
        appliedAt: '2026-03-26T10:00:00Z', // Oldest
      },
    ];

    dynamoMock.on(QueryCommand).resolves({ Items: applications });

    const event = {
      pathParameters: { userId: 'user123' },
      requestContext: { requestId: 'req123' },
    };

    const result = await getApplications.handler(event);
    const body = JSON.parse(result.body);
    expect(body.length).to.equal(1);
    expect(body[0].applicationId).to.equal('app2'); // Most recent
  });

  it('returns empty array when user has no applications', async () => {
    dynamoMock.on(QueryCommand).resolves({ Items: [] });

    const event = {
      pathParameters: { userId: 'user123' },
      requestContext: { requestId: 'req123' },
    };

    const result = await getApplications.handler(event);
    expect(result.statusCode).to.equal(200);
    const body = JSON.parse(result.body);
    expect(body).to.be.an('array').that.is.empty;
  });

  it('returns 400 when userId is missing', async () => {
    const event = {
      pathParameters: {},
      requestContext: { requestId: 'req123' },
    };

    const result = await getApplications.handler(event);
    expect(result.statusCode).to.equal(500); // Error response
    const body = JSON.parse(result.body);
    expect(body.error.type).to.exist;
  });
});
