import { ICredentials, ISignature } from '../models';
import * as _ from 'lodash';
import cr = require('crypto');
import keypair = require('keypair');

export class PaladinKeychain {
  /**
   * Generate a new keychain. Two alternative solutions are supported here,
   * one uses nodeJS crypto and OpenSSL. This is the preferred solution. However,
   * it may not be available. In that case, a pure-JS implementation is
   * used instead.
   */
  public static create(): PaladinKeychain {
    if (cr.generateKeyPairSync) {
      const { publicKey, privateKey } = cr.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });
      return new PaladinKeychain({
        publicKey,
        privateKey,
      });
    } else {
      const pair = keypair();
      return new PaladinKeychain({
        publicKey: pair.public,
        privateKey: pair.private,
      });
    }
  }

  private credentials: ICredentials;

  constructor(credentials: ICredentials) {
    if (!credentials) {
      throw new Error('Credentials must be provided');
    }
    this.credentials = credentials;
  }

  public sign(data: string): ISignature {
    const privateKey = this.credentials.privateKey;
    if (!privateKey) {
      throw new Error(
        'These credentials are not authorized to create signatures'
      );
    }
    const sign = cr.createSign('RSA-SHA256');
    sign.update(data);
    return { signature: sign.sign(privateKey, 'base64') };
  }

  public verify(data: string, signature: ISignature): boolean {
    const publicKey = this.credentials.publicKey;
    if (!publicKey) {
      throw new Error(
        'These credentials are not authorized to verify signatures'
      );
    }
    const verify = cr.createVerify('RSA-SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature.signature, 'base64');
  }

  public getCredentials(): ICredentials {
    return this.credentials;
  }
}
