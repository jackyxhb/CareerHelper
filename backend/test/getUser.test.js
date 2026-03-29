const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const getUser = require('../functions/getUser');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('getUser', () => {
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

  it('should return user data when user exists', async () => {
    const mockUser = { userId: '123', name: 'John Doe' };
    dynamoMock.on(GetCommand).resolves({ Item: mockUser });

    const event = { pathParameters: { userId: '123' } };
    const result = await getUser.handler(event);

    expect(result.statusCode).to.equal(200);
    expect(JSON.parse(result.body)).to.deep.equal(mockUser);
  });

  it('should return 404 when user does not exist', async () => {
    dynamoMock.on(GetCommand).resolves({ Item: undefined });

    const event = { pathParameters: { userId: '123' } };
    const result = await getUser.handler(event);

    expect(result.statusCode).to.equal(404);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error.type).to.equal('NotFoundError');
    expect(responseBody.error.message).to.equal('User with ID 123 not found');
  });
});
