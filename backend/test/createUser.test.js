const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require('@aws-sdk/lib-dynamodb');

const createUser = require('../functions/createUser');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('createUser', () => {
  before(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.USERS_TABLE = 'test-users-table';
  });

  beforeEach(() => {
    dynamoMock.reset();
  });

  after(() => {
    delete process.env.AWS_REGION;
    delete process.env.USERS_TABLE;
  });

  it('should create a user successfully', async () => {
    dynamoMock.on(GetCommand).resolves({ Item: undefined });
    dynamoMock.on(PutCommand).resolves({});

    const event = {
      body: JSON.stringify({
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    };
    const result = await createUser.handler(event);

    expect(result.statusCode).to.equal(201);
    expect(JSON.parse(result.body).message).to.equal(
      'User created successfully'
    );
  });

  it('should return 409 when user already exists', async () => {
    dynamoMock.on(GetCommand).resolves({
      Item: { userId: '123', email: 'test@example.com', name: 'Test User' },
    });

    const event = {
      body: JSON.stringify({
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    };
    const result = await createUser.handler(event);

    expect(result.statusCode).to.equal(409);
    const body = JSON.parse(result.body);
    expect(body.error.type).to.equal('ConflictError');
  });

  it('should return 500 on error', async () => {
    dynamoMock.on(GetCommand).resolves({ Item: undefined });
    dynamoMock.on(PutCommand).rejects(new Error('DynamoDB error'));

    const event = {
      body: JSON.stringify({
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    };
    const result = await createUser.handler(event);

    expect(result.statusCode).to.equal(500);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error.type).to.equal('InternalError');
    expect(responseBody.error.message).to.equal('Internal server error');
  });
});
