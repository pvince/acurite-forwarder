declare module 'forwarder-http' {

  import https from 'https';
  import http from 'http';
  import { ListenOptions } from 'net';
  import eventemitter3 from 'eventemitter3';

  // eslint-disable-next-line jsdoc/require-jsdoc
  export interface IEventForwardRequestRequest {
    // eslint-disable-next-line jsdoc/require-jsdoc
    protocol: string;
    // eslint-disable-next-line jsdoc/require-jsdoc
    host: string;
    // eslint-disable-next-line jsdoc/require-jsdoc
    hostname: string;
    // eslint-disable-next-line jsdoc/require-jsdoc
    port?: number;
    // eslint-disable-next-line jsdoc/require-jsdoc
    auth?: string;
    // eslint-disable-next-line jsdoc/require-jsdoc
    method: string;
    // eslint-disable-next-line jsdoc/require-jsdoc
    path: string;
    // eslint-disable-next-line jsdoc/require-jsdoc
    headers: ITargetHeaders;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  export interface IEventForwardRequestParams {
    // eslint-disable-next-line jsdoc/require-jsdoc
    request: IEventForwardRequestRequest;
    // eslint-disable-next-line jsdoc/require-jsdoc
    retry: IRetryOpts;
    /**
     * Set to true to cancel the request.
     */
    cancel?: boolean;
  }

  /**
   * Type returned by the 'forwardResponse'
   */
  export type fnForwardResponse = (req: http.ClientRequest, inc: unknown ) => void;

  /**
   * Headers dictionary object
   */
  export interface ITargetHeaders {
    [key: string]: string;
  }

  /**
   * Retry options
   */
  export interface IRetryOpts {
    /**
     * Maximum number of retries the forwarder will perform
     *
     * @default 0
     */
    maxRetries?: number;

    /**
     * Time slot for exponential backoff retry intervals in milliseconds
     *
     * @default 300
     */
    delay?: number;

    /**
     * Should the forwarder also retry if the targets respond with a 5xx status code?
     *
     * @default false
     */
    retryOnInternalError?: boolean;
  }

  /**
   * Target options
   */
  export interface ITargetOpts {
    /**
     * URL
     */
    url: string;

    /**
     * Options to use for the server requests
     */
    opts?: http.RequestOptions | https.RequestOptions;

    /**
     * Headers to send
     */
    headers?: ITargetHeaders;

    /**
     * Retry options
     */
    retry?: IRetryOpts;
  }

  /**
   * Configuration options
   */
  export interface IForwarderOpts {
    /**
     * If boolean: Create an HTTPS forwarder server.
     *
     * @default false
     */
    https?: boolean;

    /**
     * Options to pass to the https.createServer constructor. Required when using https.
     */
    httpsOpts?: https.ServerOptions;

    /**
     * Timeout on requests to targets.
     *
     * @default null
     */
    timeout?: number | null;

    /**
     * A list of target URLs or Target objects to forward requests to.
     */
    targets: (ITargetOpts | string)[];

    /**
     * Headers to add to the forwarded request.
     *
     * @default []
     */
    targetHeaders?: ITargetHeaders;

    /**
     * Options to pass to the http/https request constructor.
     */
    targetOpts?: http.RequestOptions | https.RequestOptions;

    /**
     * Retry options for all targets.
     */
    targetRetry?: IRetryOpts;

    /**
     * Status code the forward server will use when responding to requests.
     *
     * @default 200
     */
    responseStatusCode?: number;

    /**
     * Body the forward server will use when responding to requests
     *
     * @default OK
     */
    responseBody?: string;

    /**
     * Headers the forward server will  use when responding to requests
     *
     * @default {}
     */
    responseHeaders?: ITargetHeaders;
  }

  /**
   * Forwarder class
   */
  export class Forwarder extends eventemitter3 {

    /**
     * Constructor
     *
     * @param options - Configuration options
     */
    public constructor(options: IForwarderOpts);
    
    public listen(port?: number, hostname?: string, backlog?: number, listeningListener?: () => void): this;
    public listen(port?: number, hostname?: string, listeningListener?: () => void): this;
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    public listen(port?: number, backlog?: number, listeningListener?: () => void): this;
    public listen(port?: number, listeningListener?: () => void): this;
    public listen(path: string, backlog?: number, listeningListener?: () => void): this;
    public listen(path: string, listeningListener?: () => void): this;
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    public listen(options: ListenOptions, listeningListener?: () => void): this;
    // eslint-disable-next-line @typescript-eslint/unified-signatures,@typescript-eslint/no-explicit-any
    public listen(handle: any, backlog?: number, listeningListener?: () => void): this;
    // eslint-disable-next-line @typescript-eslint/unified-signatures,@typescript-eslint/no-explicit-any
    public listen(handle: any, listeningListener?: () => void): this;
  }

  export default Forwarder;
}