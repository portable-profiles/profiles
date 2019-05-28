import { ICredentials, ISignature } from '../models';
import * as _ from 'lodash';
import * as crypto from 'crypto';

export class PaladinKeychain {
  public static create(): PaladinKeychain {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
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
    const sign = crypto.createSign('RSA-SHA256');
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
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature.signature, 'base64');
  }

  public getCredentials(): ICredentials {
    return this.credentials;
  }
}
