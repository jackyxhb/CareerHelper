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
    const mockDynamoDBUtil = {
      getItem: sinon.stub().resolves(undefined), // No existing user
      putItem: sinon.stub().resolves()
    };

    handler = proxyquire('../functions/createUser', {
      '../utils/dynamodb': function() { return mockDynamoDBUtil; }
    }).handler;

    const event = {
      body: JSON.stringify({
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    };
    const result = await handler(event);

    expect(result.statusCode).to.equal(201);
    expect(JSON.parse(result.body).message).to.equal(
      'User created successfully'
    );
  });

  it('should return 500 on error', async () => {
    const mockDynamoDBUtil = {
      getItem: sinon.stub().resolves(undefined), // No existing user
      putItem: sinon.stub().rejects(new Error('DynamoDB error'))
    };

    handler = proxyquire('../functions/createUser', {
      '../utils/dynamodb': function() { return mockDynamoDBUtil; }
    }).handler;

    const event = {
      body: JSON.stringify({
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    };
    const result = await handler(event);

    expect(result.statusCode).to.equal(500);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error.type).to.equal('InternalError');
    expect(responseBody.error.message).to.equal('Internal server error');
  });
});
