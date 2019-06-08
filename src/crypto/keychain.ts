import { ICredentials, ISignature, IEncryption } from '../models';
import * as _ from 'lodash';
import cr = require('crypto');
import keypair = require('keypair');

export class PaladinKeychain {
  public static create(): PaladinKeychain {
    const pair = keypair();
    return new PaladinKeychain({
      publicKey: pair.public,
      privateKey: pair.private,
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

  public encrypt(recipient: PaladinKeychain, data: string): IEncryption {
    const publicKey = recipient.getCredentials().publicKey;
    if (!publicKey) {
      throw new Error(
        'These credentials are not authorized to encrypt data'
      );
    }

    // Encrypt with aes
    const algorithm = 'aes-256-cbc';
    const key = cr.randomBytes(32);
    const iv = cr.randomBytes(16);
    const cipher = cr.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Encrypt with asym
    const asymCipher = cr.publicEncrypt(publicKey, key);

    return {
      algorithm,
      iv: iv.toString('base64'),
      encryptedKey: asymCipher.toString('base64'),
      encryptedData: encrypted.toString('base64'),
    };
  }

  public decrypt(encryption: IEncryption): string {
    const privateKey = this.credentials.privateKey;
    if (!privateKey) {
      throw new Error(
        'These credentials are not authorized to decrypt data'
      );
    }

    const encryptedKey = Buffer.from(encryption.encryptedKey, 'base64');
    const symKey = cr.privateDecrypt(privateKey, encryptedKey);
    const iv = Buffer.from(encryption.iv, 'base64');
    const encryptedText = Buffer.from(encryption.encryptedData, 'base64');
    const decipher = cr.createDecipheriv(encryption.algorithm, Buffer.from(symKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  public getCredentials(): ICredentials {
    return this.credentials;
  }

  public getPublic() {
    const { publicKey } = this.credentials;
    return new PaladinKeychain({ publicKey });
  }

  public getPrivate() {
    const { privateKey } = this.credentials;
    return new PaladinKeychain({ privateKey });
  }
}
