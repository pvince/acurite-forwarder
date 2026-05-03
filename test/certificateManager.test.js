const path = require('path');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('certificateManager', function () {
  let expect;

  before(async function () {
    ({ expect } = await import('chai'));
  });

  function createModule(options = {}) {
    const fsStub = options.fsStub || {
      ensureDir: sinon.stub().resolves(),
      writeFile: sinon.stub().resolves(),
      readFile: sinon.stub()
    };
    const selfsignedStub = options.selfsignedStub || {
      generate: sinon.stub().returns({
        cert: 'generated-cert',
        private: 'generated-key'
      })
    };
    const logStub = options.logStub || sinon.stub();

    const certificateManager = proxyquire('../src/certificateManager.ts', {
      'fs-extra': fsStub,
      selfsigned: selfsignedStub,
      debug: sinon.stub().returns(logStub)
    });

    return {
      certificateManager,
      fsStub,
      selfsignedStub,
      logStub
    };
  }

  it('generates certificates with the expected subject and options', function () {
    const { certificateManager, selfsignedStub } = createModule();

    const result = certificateManager.generateSSLCerts();

    expect(result).to.deep.equal({
      cert: 'generated-cert',
      key: 'generated-key'
    });
    expect(selfsignedStub.generate.calledOnce).to.equal(true);
    expect(selfsignedStub.generate.firstCall.args[0]).to.deep.equal([
      { name: 'commonName', value: 'atlasapi.myacurite.com' }
    ]);
    expect(selfsignedStub.generate.firstCall.args[1]).to.deep.equal({
      keySize: 2048,
      days: 9999,
      algorithm: 'sha256'
    });
  });

  it('reads existing certificates from disk', async function () {
    const { certificateManager, fsStub } = createModule();
    const certPath = path.join('certs', 'ssl.cert');
    const keyPath = path.join('certs', 'ssl.key');

    fsStub.readFile.onFirstCall().resolves('cert-data');
    fsStub.readFile.onSecondCall().resolves('key-data');

    const result = await certificateManager.readCerts();

    expect(result).to.deep.equal({
      cert: 'cert-data',
      key: 'key-data'
    });
    expect(fsStub.readFile.firstCall.args).to.deep.equal([certPath, 'utf-8']);
    expect(fsStub.readFile.secondCall.args).to.deep.equal([keyPath, 'utf-8']);
  });

  it('returns null and logs when reading a certificate file fails', async function () {
    const { certificateManager, fsStub, logStub } = createModule();
    const readError = new Error('missing key');

    fsStub.readFile.onFirstCall().resolves('cert-data');
    fsStub.readFile.onSecondCall().rejects(readError);

    const result = await certificateManager.readCerts();

    expect(result).to.equal(null);
    expect(logStub.calledOnce).to.equal(true);
    expect(logStub.firstCall.args[0]).to.equal('Failed to load cert or key file. %s');
    expect(logStub.firstCall.args[1]).to.equal(readError);
  });

  it('writes certificates to disk after ensuring the cert directory exists', async function () {
    const { certificateManager, fsStub } = createModule();
    const certInfo = { cert: 'cert-data', key: 'key-data' };

    await certificateManager.writeCerts(certInfo);

    expect(fsStub.ensureDir.calledOnceWithExactly('certs')).to.equal(true);
    expect(fsStub.writeFile.firstCall.args).to.deep.equal([path.join('certs', 'ssl.cert'), 'cert-data']);
    expect(fsStub.writeFile.secondCall.args).to.deep.equal([path.join('certs', 'ssl.key'), 'key-data']);
  });

  it('swallows write errors and logs them', async function () {
    const ensureError = new Error('permission denied');
    const fsStub = {
      ensureDir: sinon.stub().rejects(ensureError),
      writeFile: sinon.stub().resolves(),
      readFile: sinon.stub()
    };
    const { certificateManager, logStub } = createModule({ fsStub });

    await certificateManager.writeCerts({ cert: 'cert-data', key: 'key-data' });

    expect(logStub.calledOnce).to.equal(true);
    expect(logStub.firstCall.args[0]).to.equal('Failed to write cert or key file. %s');
    expect(logStub.firstCall.args[1]).to.equal(ensureError);
  });

  it('returns existing SSL info without regenerating certificates', async function () {
    const { certificateManager, fsStub, selfsignedStub } = createModule();

    fsStub.readFile.onFirstCall().resolves('cert-data');
    fsStub.readFile.onSecondCall().resolves('key-data');

    const result = await certificateManager.getSSLInfo();

    expect(result).to.deep.equal({
      cert: 'cert-data',
      key: 'key-data'
    });
    expect(selfsignedStub.generate.called).to.equal(false);
    expect(fsStub.writeFile.called).to.equal(false);
  });

  it('generates and persists SSL info when certificate files are missing', async function () {
    const { certificateManager, fsStub, selfsignedStub } = createModule();

    fsStub.readFile.rejects(new Error('missing certs'));

    const result = await certificateManager.getSSLInfo();

    expect(result).to.deep.equal({
      cert: 'generated-cert',
      key: 'generated-key'
    });
    expect(selfsignedStub.generate.calledOnce).to.equal(true);
    expect(fsStub.ensureDir.calledOnceWithExactly('certs')).to.equal(true);
    expect(fsStub.writeFile.calledTwice).to.equal(true);
  });
});