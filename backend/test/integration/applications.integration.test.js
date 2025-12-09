const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');

const createApplication = require('../../functions/createApplication');
const getApplications = require('../../functions/getApplications');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('Applications API integration', () => {
  before(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.APPLICATIONS_TABLE = 'applications-table';
  });

  beforeEach(() => {
    dynamoMock.reset();
  });

  it('creates an application item', async () => {
    dynamoMock.on(PutCommand).resolves({});

    const response = await createApplication.handler({
      requestContext: {
        requestId: 'req-1',
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-1',
            },
          },
        },
      },
      body: JSON.stringify({
        jobId: 'job-9',
        status: 'Applied',
        notes: 'Urgent follow-up',
      }),
    });

    expect(response.statusCode).to.equal(201);

    const calls = dynamoMock.commandCalls(PutCommand);
    expect(calls).to.have.lengthOf(1);
    expect(calls[0].args[0].input.TableName).to.equal('applications-table');
    expect(calls[0].args[0].input.Item.userId).to.equal('user-1');
    expect(calls[0].args[0].input.Item.status).to.equal('APPLIED');
  });

  it('returns applications for a user', async () => {
    const mockItems = [
      { applicationId: 'app-1', userId: 'user-1', status: 'Interviewing' },
    ];

    dynamoMock.on(QueryCommand).resolves({ Items: mockItems });

    const response = await getApplications.handler({
      requestContext: { requestId: 'req-2' },
      pathParameters: { userId: 'user-1' },
    });

    expect(response.statusCode).to.equal(200);
    const body = JSON.parse(response.body);
    expect(body).to.deep.equal(mockItems);
  });
});
