const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const AWS = require('aws-sdk');
const { handler } = require('../functions/getUser');

describe('getUser', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return user data when user exists', async () => {
    const mockUser = { userId: '123', name: 'John Doe' };
    const getStub = sandbox.stub().returns({
      promise: () => Promise.resolve({ Item: mockUser })
    });
    sandbox.stub(AWS.DynamoDB, 'DocumentClient').returns({ get: getStub });

    const event = { pathParameters: { userId: '123' } };
    const result = await handler(event);

    expect(result.statusCode).to.equal(200);
    expect(JSON.parse(result.body)).to.deep.equal(mockUser);
  });

  it('should return 404 when user does not exist', async () => {
    const getStub = sandbox.stub().returns({
      promise: () => Promise.resolve({})
    });
    sandbox.stub(AWS.DynamoDB, 'DocumentClient').returns({ get: getStub });

    const event = { pathParameters: { userId: '123' } };
    const result = await handler(event);

    expect(result.statusCode).to.equal(404);
    expect(JSON.parse(result.body).message).to.equal('User not found');
  });
});