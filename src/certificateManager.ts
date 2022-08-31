import selfsigned, { Attribute, ShortAttribute } from 'selfsigned';
import path from 'path';
import fs from 'fs-extra';
import debug from 'debug';

const log = debug('acurite-forwarder:ssl');

const CERT_DIR = 'certs';
const SSL_KEY = path.join(CERT_DIR, 'ssl.key');
const SSL_CERT = path.join(CERT_DIR, 'ssl.cert');

/**
 * Certificate info
 */
export interface ICertInfo {
  /**
   * Private key
   */
  key: string;
  /**
   * Public certificate
   */
  cert: string;
}

/**
 * Generate SSL Certificate information
 *
 * @returns newly generated certificate information
 */
function generateSSLCerts(): ICertInfo {
  const attrs: Array<Attribute | ShortAttribute> = [
    { name: 'commonName', value: 'atlasapi.myacurite.com' }
  ];
  const pems = selfsigned.generate(attrs, {
    keySize: 2048,
    days: 9999,
    algorithm: 'sha256'
  });

  return {
    cert: pems.cert,
    key: pems.private
  };
}

/**
 * Writes out the certificates
 *
 * @param certInfo - Certificate info to write
 */
async function writeCerts(certInfo: ICertInfo): Promise<void> {
  try {
    await fs.ensureDir(CERT_DIR);
    await fs.writeFile(SSL_CERT, certInfo.cert);
    await fs.writeFile(SSL_KEY, certInfo.key);
  } catch (err) {
    log('Failed to write cert or key file. %s', err);
  }
}

/**
 * Read certificates from disk, if they exist.
 */
async function readCerts(): Promise<ICertInfo | null> {
  let result: ICertInfo | null = null;

  try {
    const cert = await fs.readFile(SSL_CERT, 'utf-8');
    const key = await fs.readFile(SSL_KEY, 'utf-8');

    result = { cert, key };
  } catch (err) {
    log('Failed to load cert or key file. %s', err);
  }

  return result;
}

/**
 * Load existing, or generate new, SSL certificates & return the info
 */
export async function getSSLInfo(): Promise<ICertInfo> {
  let result = await readCerts();

  if (result === null) {
    result = generateSSLCerts();

    await writeCerts(result);
  }


  return result;
}
