
import Forwarder, { IEventForwardRequestParams } from 'forwarder-http';
import debug from 'debug';
import fs from 'fs-extra';

const log = debug('acurite-forwarder');
const logRequest = log.extend('forwardRequest');
const logResponse = log.extend('forwardResponse');
const logError = log.extend('error');
const logOtherResponse = log.extend('response');

/**
 * Configuration file structure
 */
export interface IConfig {
  /**
   * Array of hosts to forward too
   */
  target_hosts: string[];
}

/**
 * Starts the forwarder, forwarding to all specified hosts.
 *
 * @param config - Configuration
 * @returns - Promise that resolves once the service is running.
 */
async function startForwarder(config: IConfig): Promise<void> {
  return new Promise((resolve) => {
    log('Starting...');
    const server = new Forwarder({
      targets: config.target_hosts
    });

    const listenPort = 80;
    server.listen(listenPort, () => {
      log('Listening on port 80, and forwarding requests.');
      resolve();
    });

    server.on('forwardRequest', (params: IEventForwardRequestParams) => {
      const requestInfo = params.request;
      requestInfo.path =  requestInfo.path.replaceAll('\\', '/');
      logRequest('=> %s %s%s', requestInfo.method, requestInfo.host, requestInfo.path);
    });

    server.on('forwardResponse', (req: unknown, inc: unknown) => {
      // @ts-expect-error blasd
      logResponse(`${req.getHeader('host')} responded: ${inc.statusCode} : ${inc.statusMessage}`);
    });

    server.on('response', (inc, res) => {
      // Send the token back with the forwarder response
      logOtherResponse('....');
    });

    server.on('forwardRequestError', (err: Error, req: unknown) => {
      // @ts-expect-error blasd
      logError(`${req.getHeader('host')} failed: ${err.code} ${err.message}`);
    });
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

loadConfig()
  .then((config) =>  startForwarder(config))
  .catch((err) => {
    console.error(err);
  });