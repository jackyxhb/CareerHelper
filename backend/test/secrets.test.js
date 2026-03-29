'use strict';

const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const { SecretsManager } = require('../utils/secrets');

const ssmMock = mockClient(SSMClient);

describe('SecretsManager.getAdzunaCredentials', () => {
  let sm;

  beforeEach(() => {
    ssmMock.reset();
    sm = new SecretsManager();
  });

  it('returns appId and appKey when both SSM params exist', async () => {
    ssmMock
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-id' })
      .resolves({ Parameter: { Value: 'my-app-id' } })
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-key' })
      .resolves({ Parameter: { Value: 'my-app-key' } });

    const creds = await sm.getAdzunaCredentials('dev');
    expect(creds).to.deep.equal({ appId: 'my-app-id', appKey: 'my-app-key' });
  });

  it('returns null when SSM param is not found (not configured)', async () => {
    const err = new Error('Parameter not found');
    err.name = 'ParameterNotFound';
    ssmMock.on(GetParameterCommand).rejects(err);

    const creds = await sm.getAdzunaCredentials('dev');
    expect(creds).to.be.null;
  });

  it('returns null (not throws) for any SSM error', async () => {
    ssmMock.on(GetParameterCommand).rejects(new Error('SSM unavailable'));

    const creds = await sm.getAdzunaCredentials('dev');
    expect(creds).to.be.null;
  });

  it('returns null when appId is empty string', async () => {
    ssmMock
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-id' })
      .resolves({ Parameter: { Value: '' } })
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-key' })
      .resolves({ Parameter: { Value: 'my-app-key' } });

    const creds = await sm.getAdzunaCredentials('dev');
    expect(creds).to.be.null;
  });

  it('uses stage param to build SSM path', async () => {
    ssmMock
      .on(GetParameterCommand, { Name: '/careerhelper/prod/adzuna-app-id' })
      .resolves({ Parameter: { Value: 'prod-id' } })
      .on(GetParameterCommand, { Name: '/careerhelper/prod/adzuna-app-key' })
      .resolves({ Parameter: { Value: 'prod-key' } });

    const creds = await sm.getAdzunaCredentials('prod');
    expect(creds).to.deep.equal({ appId: 'prod-id', appKey: 'prod-key' });
  });
});

describe('SecretsManager cache', () => {
  let sm;

  beforeEach(() => {
    ssmMock.reset();
    sm = new SecretsManager();
  });

  it('caches SSM parameter values and avoids duplicate calls', async () => {
    ssmMock
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-id' })
      .resolves({ Parameter: { Value: 'cached-id' } })
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-key' })
      .resolves({ Parameter: { Value: 'cached-key' } });

    await sm.getAdzunaCredentials('dev');
    await sm.getAdzunaCredentials('dev'); // second call — should hit cache

    expect(ssmMock.commandCalls(GetParameterCommand)).to.have.length(2); // only 2 SSM calls total
  });

  it('clearCache forces re-fetch on next call', async () => {
    ssmMock
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-id' })
      .resolves({ Parameter: { Value: 'id-v1' } })
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-key' })
      .resolves({ Parameter: { Value: 'key-v1' } });

    await sm.getAdzunaCredentials('dev');
    sm.clearCache();

    ssmMock.reset();
    ssmMock
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-id' })
      .resolves({ Parameter: { Value: 'id-v2' } })
      .on(GetParameterCommand, { Name: '/careerhelper/dev/adzuna-app-key' })
      .resolves({ Parameter: { Value: 'key-v2' } });

    const creds = await sm.getAdzunaCredentials('dev');
    expect(creds).to.deep.equal({ appId: 'id-v2', appKey: 'key-v2' });
  });
});
