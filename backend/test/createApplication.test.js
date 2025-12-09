const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const {
  DynamoDBDocumentClient,
  PutCommand,
} = require('@aws-sdk/lib-dynamodb');

const createApplication = require('../functions/createApplication');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('createApplication handler', () => {
  before(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.APPLICATIONS_TABLE = 'applications-table';
  });

  beforeEach(() => {
    dynamoMock.reset();
  });

  after(() => {
    delete process.env.AWS_REGION;
    delete process.env.APPLICATIONS_TABLE;
  });

  it('creates an application for the authenticated user and normalizes status', async () => {
    dynamoMock.on(PutCommand).resolves({});

    const response = await createApplication.handler({
      requestContext: {
        requestId: 'req-123',
        authorizer: {
          jwt: {
            claims: {
              sub: 'auth-user-1',
            },
          },
        },
      },
      body: JSON.stringify({
        userId: 'tampered-user',
        jobId: 'job-100',
        status: 'applied',
        notes: 'follow up soon',
      }),
    });

    expect(response.statusCode).to.equal(201);
    const call = dynamoMock.commandCalls(PutCommand)[0];
    expect(call).to.not.be.undefined;
    const item = call.args[0].input.Item;
    expect(item.userId).to.equal('auth-user-1');
    expect(item.status).to.equal('APPLIED');
    expect(item.notes).to.equal('follow up soon');
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await createApplication.handler({
      requestContext: {
        requestId: 'req-456',
        authorizer: {
          jwt: {
            claims: {
              sub: 'auth-user-2',
            },
          },
        },
      },
      body: JSON.stringify({ status: 'APPLIED' }),
    });

    expect(response.statusCode).to.equal(400);
    const body = JSON.parse(response.body);
    expect(body.error.type).to.equal('ValidationError');
  });

  it('returns 401 when the request is unauthenticated', async () => {
    const response = await createApplication.handler({
      requestContext: { requestId: 'req-789' },
      body: JSON.stringify({ jobId: 'job-1', status: 'APPLIED' }),
    });

    expect(response.statusCode).to.equal(401);
    const body = JSON.parse(response.body);
    expect(body.error.type).to.equal('UnauthorizedError');
  });
});
