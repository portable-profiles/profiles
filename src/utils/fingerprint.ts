import crypto = require('crypto');
import { ICredentials } from '../models';

export function fingerprint(credentials?: ICredentials) {
  if (!credentials) {
    throw new Error('There are no credentials to fingerprint');
  }
  if (!credentials.publicKey) {
    throw new Error('There is no public key to fingerprint');
  }
  return crypto
    .createHash('sha256')
    .update(credentials.publicKey)
    .digest('base64');
}
