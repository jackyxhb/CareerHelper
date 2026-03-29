const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const updateApplication = require('../functions/updateApplication');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('updateApplication', () => {
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

  it('transitions application from SAVED to APPLIED', async () => {
    const existingApp = {
      userId: 'user123',
      applicationId: 'app1',
      jobTitle: 'Engineer',
      jobCompany: 'TechCorp',
      jobLocation: 'Auckland',
      status: 'SAVED',
      createdAt: '2026-03-28T10:00:00Z',
    };

    dynamoMock.on(GetCommand).resolves({ Item: existingApp });
    dynamoMock.on(UpdateCommand).resolves({
      Attributes: {
        ...existingApp,
        status: 'APPLIED',
        updatedAt: '2026-03-29T10:00:00Z',
      },
    });

    const event = {
      pathParameters: { userId: 'user123', applicationId: 'app1' },
      requestContext: { requestId: 'req123' },
      body: JSON.stringify({
        status: 'APPLIED',
        appliedAt: '2026-03-29T10:00:00Z',
      }),
    };

    const result = await updateApplication.handler(event);
    expect(result.statusCode).to.equal(200);
    const body = JSON.parse(result.body);
    expect(body.message).to.equal('Application updated');
  });

  it('returns 404 when application does not exist', async () => {
    dynamoMock.on(GetCommand).resolves({});

    const event = {
      pathParameters: { userId: 'user123', applicationId: 'nonexistent' },
      requestContext: { requestId: 'req123' },
      body: JSON.stringify({ status: 'APPLIED' }),
    };

    const result = await updateApplication.handler(event);
    expect(result.statusCode).to.equal(404);
    const body = JSON.parse(result.body);
    expect(body.error.type).to.equal('NotFoundError');
  });

  it('returns 400 when trying to revert APPLIED to SAVED', async () => {
    const existingApp = {
      userId: 'user123',
      applicationId: 'app1',
      status: 'APPLIED',
      appliedAt: '2026-03-27T10:00:00Z',
    };

    dynamoMock.on(GetCommand).resolves({ Item: existingApp });

    const event = {
      pathParameters: { userId: 'user123', applicationId: 'app1' },
      requestContext: { requestId: 'req123' },
      body: JSON.stringify({ status: 'SAVED' }),
    };

    const result = await updateApplication.handler(event);
    expect(result.statusCode).to.equal(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).to.include(
      'Cannot revert applied job to saved state'
    );
  });

  it('returns 400 when status field is missing', async () => {
    const event = {
      pathParameters: { userId: 'user123', applicationId: 'app1' },
      requestContext: { requestId: 'req123' },
      body: JSON.stringify({}),
    };

    const result = await updateApplication.handler(event);
    expect(result.statusCode).to.equal(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).to.include('status field is required');
  });

  it('returns 400 when userId path parameter is missing', async () => {
    const event = {
      pathParameters: { applicationId: 'app1' },
      requestContext: { requestId: 'req123' },
      body: JSON.stringify({ status: 'APPLIED' }),
    };

    const result = await updateApplication.handler(event);
    expect(result.statusCode).to.equal(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).to.include(
      'Missing required path parameter: userId'
    );
  });

  it('persists notes field when provided', async () => {
    const existingApp = {
      userId: 'user123',
      applicationId: 'app1',
      status: 'SAVED',
    };

    dynamoMock.on(GetCommand).resolves({ Item: existingApp });
    dynamoMock.on(UpdateCommand).resolves({
      Attributes: {
        ...existingApp,
        status: 'APPLIED',
        notes: 'Excited about this role',
      },
    });

    const event = {
      pathParameters: { userId: 'user123', applicationId: 'app1' },
      requestContext: { requestId: 'req123' },
      body: JSON.stringify({
        status: 'APPLIED',
        notes: 'Excited about this role',
      }),
    };

    const result = await updateApplication.handler(event);
    expect(result.statusCode).to.equal(200);
    const body = JSON.parse(result.body);
    expect(body.message).to.equal('Application updated');
  });
});
