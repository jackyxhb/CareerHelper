const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const deleteApplication = require('../functions/deleteApplication');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('deleteApplication', () => {
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

  it('successfully deletes an existing application', async () => {
    const existingApp = {
      userId: 'user123',
      applicationId: 'app1',
      jobTitle: 'Engineer',
      status: 'APPLIED',
    };

    dynamoMock.on(GetCommand).resolves({ Item: existingApp });
    dynamoMock.on(DeleteCommand).resolves({});

    const event = {
      pathParameters: { userId: 'user123', applicationId: 'app1' },
      requestContext: { requestId: 'req123' },
    };

    const result = await deleteApplication.handler(event);
    expect(result.statusCode).to.equal(200);
    const body = JSON.parse(result.body);
    expect(body.message).to.equal('Application deleted');
    expect(body.userId).to.equal('user123');
    expect(body.applicationId).to.equal('app1');
  });

  it('returns 404 when application does not exist', async () => {
    dynamoMock.on(GetCommand).resolves({});

    const event = {
      pathParameters: { userId: 'user123', applicationId: 'nonexistent' },
      requestContext: { requestId: 'req123' },
    };

    const result = await deleteApplication.handler(event);
    expect(result.statusCode).to.equal(404);
    const body = JSON.parse(result.body);
    expect(body.error.type).to.equal('NotFoundError');
  });

  it('returns 400 when userId path parameter is missing', async () => {
    const event = {
      pathParameters: { applicationId: 'app1' },
      requestContext: { requestId: 'req123' },
    };

    const result = await deleteApplication.handler(event);
    expect(result.statusCode).to.equal(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).to.include(
      'Missing required path parameter: userId'
    );
  });

  it('returns 400 when applicationId path parameter is missing', async () => {
    const event = {
      pathParameters: { userId: 'user123' },
      requestContext: { requestId: 'req123' },
    };

    const result = await deleteApplication.handler(event);
    expect(result.statusCode).to.equal(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).to.include(
      'Missing required path parameter: applicationId'
    );
  });

  it('returns 500 when DynamoDB delete fails', async () => {
    const existingApp = {
      userId: 'user123',
      applicationId: 'app1',
      status: 'APPLIED',
    };

    dynamoMock.on(GetCommand).resolves({ Item: existingApp });
    dynamoMock.on(DeleteCommand).rejects(new Error('DynamoDB service error'));

    const event = {
      pathParameters: { userId: 'user123', applicationId: 'app1' },
      requestContext: { requestId: 'req123' },
    };

    const result = await deleteApplication.handler(event);
    expect(result.statusCode).to.equal(500);
    const body = JSON.parse(result.body);
    expect(body.error.type).to.exist;
  });
});
