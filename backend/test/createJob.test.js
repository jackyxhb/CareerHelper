const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const {
  DynamoDBDocumentClient,
  PutCommand,
} = require('@aws-sdk/lib-dynamodb');

const createJob = require('../functions/createJob');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('createJob handler', () => {
  before(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.JOBS_TABLE = 'jobs-table';
  });

  beforeEach(() => {
    dynamoMock.reset();
  });

  after(() => {
    delete process.env.AWS_REGION;
    delete process.env.JOBS_TABLE;
  });

  it('creates a job record with generated jobId', async () => {
    dynamoMock.on(PutCommand).resolves({});

    const response = await createJob.handler({
      requestContext: { requestId: 'req-job-1' },
      body: JSON.stringify({
        jobId: 'should-be-ignored',
        title: 'Software Engineer',
        company: 'CareerHelper',
        location: 'Remote',
      }),
    });

    expect(response.statusCode).to.equal(201);
    const call = dynamoMock.commandCalls(PutCommand)[0];
    expect(call).to.not.be.undefined;
    const item = call.args[0].input.Item;
    expect(item.jobId).to.be.a('string');
    expect(item.jobId).to.have.length.greaterThan(0);
    expect(item.title).to.equal('Software Engineer');
    expect(item.company).to.equal('CareerHelper');
    expect(item.location).to.equal('Remote');
    expect(item.postedAt).to.be.a('string');
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await createJob.handler({
      requestContext: { requestId: 'req-job-2' },
      body: JSON.stringify({ company: 'CareerHelper' }),
    });

    expect(response.statusCode).to.equal(400);
    const body = JSON.parse(response.body);
    expect(body.error.type).to.equal('ValidationError');
  });
});
