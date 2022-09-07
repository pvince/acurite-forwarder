
import Forwarder, { IEventForwardRequestParams } from 'forwarder-http';
import debug from 'debug';
import fs from 'fs-extra';
import { getSSLInfo } from './certificateManager';
import { ClientRequest, ServerResponse } from 'http';
import dateFormat from 'dateformat';

const log = debug('acurite-forwarder');

const logHTTP = log.extend('http');
const logHTTPS = log.extend('https');

/**
 * Configuration file structure
 */
export interface IConfig {
  /**
   * Array of hosts to forward standard HTTP requests too
   */
  target_hosts_http: string[];

  /**
   * Array of hosts to forward HTTPS requests too.
   */
  target_hosts_https: string[];
}

/**
 * Handle creating a response for the client.
 *
 * @param req - Client Request
 * @param res - Server Response to populate.
 */
function _respond(req: ClientRequest, res: ServerResponse): void {
  const now = new Date();

  const response = {
    localtime: dateFormat(now, 'HH:MM:ss')
  };

  res.setHeader('content-type', 'application/json');
  res.write(JSON.stringify(response));
  res.end();
}

/**
 * Starts the forwarder, forwarding to all specified hosts.
 *
 * @param config - Configuration
 * @returns - Promise that resolves once the service is running.
 */
async function startHTTPForwarder(config: IConfig): Promise<void> {
  return new Promise((resolve,  reject) => {
    try {
      logHTTP('Starting HTTP...');
      const server = new Forwarder({
        targets: config.target_hosts_http,
        targetOpts: {
          rejectUnauthorized: false
        }
      });

      const listenPort = 80;
      server.listen(listenPort, () => {
        logHTTP(`Listening on port ${listenPort}, and forwarding requests.`);
        resolve();
      });

      server.on('forwardRequest', (params: IEventForwardRequestParams) => {
        const requestInfo = params.request;
        requestInfo.path =  requestInfo.path.replaceAll('\\', '/');
        logHTTP('==> %s %s%s', requestInfo.method, requestInfo.host, requestInfo.path);
      });

      server.on('response', _respond);

      server.on('forwardResponse', (req: unknown, inc: unknown) => {
        // @ts-expect-error blasd
        logHTTP(`<== ${req.getHeader('host')} responded: ${inc.statusCode} : ${inc.statusMessage}`);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Start the HTTPS forwarder, forwarding to all specified hosts.
 *
 * @param config - Configuration
 * @returns - Promise that resolves once the service is running
 */
async function startHTTPSForwarder(config: IConfig): Promise<void> {
  logHTTPS('Loading SSL Certs...');
  const certInfo = await getSSLInfo();

  return new Promise((resolve,  reject) => {
    try {
      logHTTPS('Starting HTTPS...');
      const server = new Forwarder({
        targets: config.target_hosts_https,
        https: true,
        httpsOpts: certInfo,
        targetOpts: {
          rejectUnauthorized: false
        }
      });

      const listenPort = 443;
      server.listen(listenPort, () => {
        logHTTPS(`Listening on port ${listenPort}, and forwarding requests.`);
        resolve();
      });

      server.on('response', _respond);

      server.on('forwardRequest', (params: IEventForwardRequestParams) => {
        const requestInfo = params.request;
        requestInfo.path =  requestInfo.path.replaceAll('\\', '/');
        logHTTPS('==> %s %s%s', requestInfo.method, requestInfo.host, requestInfo.path);
      });

      server.on('forwardResponse', (req: unknown, inc: unknown) => {
        // @ts-expect-error blasd
        logHTTPS(`<== ${req.getHeader('host')} responded: ${inc.statusCode} : ${inc.statusMessage}`);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Load the configuration
 *
 * @returns - Returns the configuration loaded from disk.
 */
function loadConfig(): Promise<IConfig> {
  return fs.readJSON('config.json');
}

/**
 * Main startup function.
 */
async function startup(): Promise<void> {
  console.log('Starting up...');
  const config = await loadConfig();
  const httpStartup = startHTTPForwarder(config);
  const httpsStartup = startHTTPSForwarder(config);

  await httpStartup;
  await httpsStartup;
  console.log('Started forwarders');
}

startup()
  .catch((err) => {
    console.error(`Error: ${err}`);
  });