const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('createUser', () => {
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

  it('should create a user successfully', async () => {
    const mockSend = sandbox.stub().resolves();
    
    // Mock the DynamoDBDocumentClient
    const mockDynamoDBDocumentClient = {
      send: mockSend
    };
    
    const mockDynamoDBClient = sandbox.stub();
    
    handler = proxyquire('../functions/createUser', {
      '@aws-sdk/client-dynamodb': { DynamoDBClient: mockDynamoDBClient },
      '@aws-sdk/lib-dynamodb': {
        DynamoDBDocumentClient: {
          from: () => mockDynamoDBDocumentClient
        }
      }
    }).handler;

    const event = {
      body: JSON.stringify({
        userId: '123',
        email: 'test@example.com',
        name: 'Test User'
      })
    };
    const result = await handler(event);

    expect(result.statusCode).to.equal(201);
    expect(JSON.parse(result.body).message).to.equal('User created successfully');
    expect(mockSend.calledOnce).to.be.true;
  });

  it('should return 500 on error', async () => {
    const mockSend = sandbox.stub().rejects(new Error('DynamoDB error'));
    
    // Mock the DynamoDBDocumentClient
    const mockDynamoDBDocumentClient = {
      send: mockSend
    };
    
    const mockDynamoDBClient = sandbox.stub();
    
    handler = proxyquire('../functions/createUser', {
      '@aws-sdk/client-dynamodb': { DynamoDBClient: mockDynamoDBClient },
      '@aws-sdk/lib-dynamodb': {
        DynamoDBDocumentClient: {
          from: () => mockDynamoDBDocumentClient
        }
      }
    }).handler;

    const event = {
      body: JSON.stringify({
        userId: '123',
        email: 'test@example.com',
        name: 'Test User'
      })
    };
    const result = await handler(event);

    expect(result.statusCode).to.equal(500);
    expect(JSON.parse(result.body).message).to.equal('Internal server error');
  });
});