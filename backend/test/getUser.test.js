const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('getUser', () => {
  let sandbox;
  let handler;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    process.env.AWS_REGION = 'us-east-1';
    process.env.USERS_TABLE = 'test-users-table';
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.AWS_REGION;
    delete process.env.USERS_TABLE;
  });

  it('should return user data when user exists', async () => {
    const mockUser = { userId: '123', name: 'John Doe' };
    const mockSend = sandbox.stub().resolves({ Item: mockUser });

    // Mock the DynamoDBDocumentClient
    const mockDynamoDBDocumentClient = {
      send: mockSend,
    };

    const mockDynamoDBClient = sandbox.stub();

    handler = proxyquire('../functions/getUser', {
      '@aws-sdk/client-dynamodb': { DynamoDBClient: mockDynamoDBClient },
      '@aws-sdk/lib-dynamodb': {
        DynamoDBDocumentClient: {
          from: () => mockDynamoDBDocumentClient,
        },
      },
    }).handler;

    const event = { pathParameters: { userId: '123' } };
    const result = await handler(event);

    expect(result.statusCode).to.equal(200);
    expect(JSON.parse(result.body)).to.deep.equal(mockUser);
  });

  it('should return 404 when user does not exist', async () => {
    const mockSend = sandbox.stub().resolves({});

    // Mock the DynamoDBDocumentClient
    const mockDynamoDBDocumentClient = {
      send: mockSend,
    };

    const mockDynamoDBClient = sandbox.stub();

    handler = proxyquire('../functions/getUser', {
      '@aws-sdk/client-dynamodb': { DynamoDBClient: mockDynamoDBClient },
      '@aws-sdk/lib-dynamodb': {
        DynamoDBDocumentClient: {
          from: () => mockDynamoDBDocumentClient,
        },
      },
    }).handler;

    const event = { pathParameters: { userId: '123' } };
    const result = await handler(event);

    expect(result.statusCode).to.equal(404);
    expect(JSON.parse(result.body).message).to.equal('User not found');
  });
});
