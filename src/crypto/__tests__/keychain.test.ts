import { Keychain } from '../keychain';
import * as uuidv4 from 'uuid/v4';

const data = 'bbf43a61-dad4-43ca-8ebd-a04710bdeb49';

test('create a key, sign, and verify', () => {
  const keychain = Keychain.create();
  const signature = keychain.sign(data);
  expect(keychain.verify(data, signature)).toBe(true);
});

test('try to verify an invalid signature', () => {
  const keychain = Keychain.create();
  expect(keychain.verify(data, { signature: 'INVALID' })).toBe(false);
});

test('try to verify changed data', () => {
  const keychain = Keychain.create();
  const signature = keychain.sign(data);
  expect(keychain.verify('INVALID', signature)).toBe(false);
});

test('retrieve and re-use a key', () => {
  const creds = Keychain.create().getCredentials();
  const keychain = new Keychain(creds);
  const signature = keychain.sign(data);
  expect(keychain.verify(data, signature)).toBe(true);
});

test('verify that credentials must be provided', () => {
  expect(() => {
    const keychain = new Keychain(null as any);
  }).toThrow();
});

test('verify that private key must be present to sign', () => {
  const creds = Keychain.create().getCredentials();
  const keychain = new Keychain({ publicKey: creds.publicKey });
  expect(() => {
    const signature = keychain.sign(data);
  }).toThrow();
});

test('verify that public key must be present to sign', () => {
  const creds = Keychain.create().getCredentials();
  const keychain = new Keychain({ privateKey: creds.privateKey });
  const signature = keychain.sign(data);
  expect(() => {
    expect(keychain.verify(data, signature)).toBe(true);
  }).toThrow();
});

test('verify encryption and decryption', () => {
  const secret = uuidv4();

  // Alice creates her keychain
  const alice = Keychain.create();
  const alicePublic = alice.getPublic();

  // ...
  // Alice transmits `alicePublic` to bob
  // ...

  // Bob creates his keychain and encrypts data for alice
  const bob = Keychain.create();
  const encryption = bob.encrypt(alicePublic, secret);

  // Verify structure of created encryption
  expect(encryption.iv).toBeTruthy();
  expect(encryption.encryptedKey).toBeTruthy();
  expect(encryption.encryptedData).toBeTruthy();
  expect(encryption.encryptedData).not.toContain(secret);
  expect(encryption.algorithm).toEqual('aes-256-cbc');

  // ...
  // Bob transmits `encryption` to alice
  // ...

  // Verify that alice can read the message
  const receive = alice.decrypt(encryption);
  expect(receive).toEqual(secret);
});

test('verify encryption restrictions', () => {
  const alice = Keychain.create().getPublic();
  const bob = Keychain.create().getPublic();
  const secret = uuidv4();
  expect(() => {
    alice.encrypt(bob.getPrivate(), secret);
  }).toThrow();
});

test('verify decryption restrictions', () => {
  const secret = uuidv4();
  const alice = Keychain.create();
  const alicePublic = alice.getPublic();
  const bob = Keychain.create();
  const encryption = bob.encrypt(alicePublic, secret);

  expect(() => {
    bob.getPublic().decrypt(encryption);
  }).toThrow();
});
