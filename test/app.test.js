const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app', function () {
  let expect;

  before(async function () {
    ({ expect } = await import('chai'));
  });

  function createLoggerSet() {
    const baseLogger = sinon.stub();
    const httpLogger = sinon.stub();
    const httpsLogger = sinon.stub();

    baseLogger.extend = sinon.stub();
    baseLogger.extend.withArgs('http').returns(httpLogger);
    baseLogger.extend.withArgs('https').returns(httpsLogger);

    return {
      baseLogger,
      httpLogger,
      httpsLogger
    };
  }

  function createAppModule(options = {}) {
    const config = options.config || {
      target_hosts_http: ['http://example.com'],
      target_hosts_https: ['https://example.com']
    };
    const certInfo = options.certInfo || {
      cert: 'cert-data',
      key: 'key-data'
    };
    const fsStub = options.fsStub || {
      readJSON: sinon.stub().resolves(config)
    };
    const getSSLInfoStub = options.getSSLInfoStub || sinon.stub().resolves(certInfo);
    const dateFormatStub = options.dateFormatStub || sinon.stub().returns('12:34:56');
    const loggerSet = options.loggerSet || createLoggerSet();
    const constructorErrors = [...(options.constructorErrors || [])];
    const instances = [];

    class FakeForwarder {
      constructor(forwarderOptions) {
        const constructionError = constructorErrors.shift();

        if (constructionError) {
          throw constructionError;
        }

        this.options = forwarderOptions;
        this.eventHandlers = {};
        this.listenPorts = [];
        instances.push(this);
      }

      listen(port, listeningListener) {
        this.listenPorts.push(port);

        if (listeningListener) {
          listeningListener();
        }

        return this;
      }

      on(eventName, handler) {
        this.eventHandlers[eventName] = handler;
        return this;
      }
    }

    const app = proxyquire('../src/app.ts', {
      'forwarder-http': FakeForwarder,
      debug: sinon.stub().returns(loggerSet.baseLogger),
      'fs-extra': fsStub,
      './certificateManager': { getSSLInfo: getSSLInfoStub },
      dateformat: dateFormatStub
    });

    return {
      app,
      instances,
      fsStub,
      getSSLInfoStub,
      dateFormatStub,
      loggerSet,
      config,
      certInfo
    };
  }

  it('responds with JSON localtime data', function () {
    const { app, dateFormatStub } = createAppModule();
    const response = {
      setHeader: sinon.stub(),
      write: sinon.stub(),
      end: sinon.stub()
    };

    app.respond({}, response);

    expect(dateFormatStub.calledOnce).to.equal(true);
    expect(dateFormatStub.firstCall.args[1]).to.equal('HH:MM:ss');
    expect(response.setHeader.calledOnceWithExactly('content-type', 'application/json')).to.equal(true);
    expect(JSON.parse(response.write.firstCall.args[0])).to.deep.equal({
      localtime: '12:34:56'
    });
    expect(response.end.calledOnceWithExactly()).to.equal(true);
  });

  it('loads config from disk', async function () {
    const { app, fsStub, config } = createAppModule();

    const result = await app.loadConfig();

    expect(result).to.deep.equal(config);
    expect(fsStub.readJSON.calledOnceWithExactly('config.json')).to.equal(true);
  });

  it('starts the HTTP forwarder with the expected handlers and options', async function () {
    const { app, instances, loggerSet, config } = createAppModule();
    const requestInfo = {
      method: 'GET',
      host: 'example.com',
      path: 'foo\\bar'
    };

    await app.startHTTPForwarder(config);

    expect(instances).to.have.length(1);
    expect(instances[0].options).to.deep.equal({
      targets: config.target_hosts_http,
      targetOpts: {
        rejectUnauthorized: false
      }
    });
    expect(instances[0].listenPorts).to.deep.equal([80]);
    expect(instances[0].eventHandlers.response).to.equal(app.respond);

    instances[0].eventHandlers.forwardRequest({ request: requestInfo });

    expect(requestInfo.path).to.equal('foo/bar');
    expect(loggerSet.httpLogger.calledWith('==> %s %s%s', 'GET', 'example.com', 'foo/bar')).to.equal(true);

    instances[0].eventHandlers.forwardResponse(
      { getHeader: sinon.stub().withArgs('host').returns('upstream-http') },
      { statusCode: 200, statusMessage: 'OK' }
    );

    expect(loggerSet.httpLogger.calledWith('<== upstream-http responded: 200 : OK')).to.equal(true);
  });

  it('rejects if the HTTP forwarder cannot be constructed', async function () {
    const { app, config } = createAppModule({
      constructorErrors: [new Error('http boom')]
    });
    let caughtError = null;

    try {
      await app.startHTTPForwarder(config);
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).to.not.equal(null);
    expect(caughtError.message).to.equal('http boom');
  });

  it('starts the HTTPS forwarder with certificates and handlers', async function () {
    const { app, instances, getSSLInfoStub, loggerSet, config, certInfo } = createAppModule();
    const requestInfo = {
      method: 'POST',
      host: 'secure.example.com',
      path: 'secure\\path'
    };

    await app.startHTTPSForwarder(config);

    expect(getSSLInfoStub.calledOnce).to.equal(true);
    expect(instances).to.have.length(1);
    expect(instances[0].options).to.deep.equal({
      targets: config.target_hosts_https,
      https: true,
      httpsOpts: certInfo,
      targetOpts: {
        rejectUnauthorized: false
      }
    });
    expect(instances[0].listenPorts).to.deep.equal([443]);
    expect(instances[0].eventHandlers.response).to.equal(app.respond);

    instances[0].eventHandlers.forwardRequest({ request: requestInfo });

    expect(requestInfo.path).to.equal('secure/path');
    expect(loggerSet.httpsLogger.calledWith('==> %s %s%s', 'POST', 'secure.example.com', 'secure/path')).to.equal(true);

    instances[0].eventHandlers.forwardResponse(
      { getHeader: sinon.stub().withArgs('host').returns('upstream-https') },
      { statusCode: 201, statusMessage: 'Created' }
    );

    expect(loggerSet.httpsLogger.calledWith('<== upstream-https responded: 201 : Created')).to.equal(true);
  });

  it('rejects if the HTTPS forwarder cannot be constructed', async function () {
    const { app, config } = createAppModule({
      constructorErrors: [new Error('https boom')]
    });
    let caughtError = null;

    try {
      await app.startHTTPSForwarder(config);
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).to.not.equal(null);
    expect(caughtError.message).to.equal('https boom');
  });

  it('starts both forwarders during startup', async function () {
    const { app, instances, fsStub, getSSLInfoStub } = createAppModule();

    await app.startup();

    expect(fsStub.readJSON.calledOnceWithExactly('config.json')).to.equal(true);
    expect(getSSLInfoStub.calledOnce).to.equal(true);
    expect(instances).to.have.length(2);
    expect(instances[0].listenPorts).to.deep.equal([80]);
    expect(instances[1].listenPorts).to.deep.equal([443]);
  });

  it('rejects startup when config loading fails', async function () {
    const fsStub = {
      readJSON: sinon.stub().rejects(new Error('missing config'))
    };
    const { app, instances } = createAppModule({ fsStub });
    let caughtError = null;

    try {
      await app.startup();
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).to.not.equal(null);
    expect(caughtError.message).to.equal('missing config');
    expect(instances).to.have.length(0);
  });

  it('rejects startup when HTTPS certificate loading fails', async function () {
    const { app, instances } = createAppModule({
      getSSLInfoStub: sinon.stub().rejects(new Error('ssl failure'))
    });
    let caughtError = null;

    try {
      await app.startup();
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).to.not.equal(null);
    expect(caughtError.message).to.equal('ssl failure');
    expect(instances).to.have.length(1);
    expect(instances[0].listenPorts).to.deep.equal([80]);
  });
});