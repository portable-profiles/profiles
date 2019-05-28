import { PaladinKeychain } from '../keychain';

const data = 'bbf43a61-dad4-43ca-8ebd-a04710bdeb49';

test('create a key, sign, and verify', () => {
  const keychain = PaladinKeychain.create();
  const signature = keychain.sign(data);
  expect(keychain.verify(data, signature)).toBe(true);
});

test('try to verify an invalid signature', () => {
  const keychain = PaladinKeychain.create();
  expect(keychain.verify(data, { signature: 'INVALID' })).toBe(false);
});

test('try to verify changed data', () => {
  const keychain = PaladinKeychain.create();
  const signature = keychain.sign(data);
  expect(keychain.verify('INVALID', signature)).toBe(false);
});

test('retrieve and re-use a key', () => {
  const creds = PaladinKeychain.create().getCredentials();
  const keychain = new PaladinKeychain(creds);
  const signature = keychain.sign(data);
  expect(keychain.verify(data, signature)).toBe(true);
});

test('verify that credentials must be provided', () => {
  expect(() => {
    const keychain = new PaladinKeychain(null as any);
  }).toThrow();
});

test('verify that private key must be present to sign', () => {
  const creds = PaladinKeychain.create().getCredentials();
  const keychain = new PaladinKeychain({ publicKey: creds.publicKey });
  expect(() => {
    const signature = keychain.sign(data);
  }).toThrow();
});

test('verify that public key must be present to sign', () => {
  const creds = PaladinKeychain.create().getCredentials();
  const keychain = new PaladinKeychain({ privateKey: creds.privateKey });
  const signature = keychain.sign(data);
  expect(() => {
    expect(keychain.verify(data, signature)).toBe(true);
  }).toThrow();
});
