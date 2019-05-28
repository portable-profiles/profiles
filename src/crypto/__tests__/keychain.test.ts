import { PaladinKeychain } from '../keychain';

const data = 'bbf43a61-dad4-43ca-8ebd-a04710bdeb49';

test('create a key, sign, and verify', () => {
  const keychain = PaladinKeychain.create();
  const signature = keychain.sign(data);
  expect(keychain.verify(data, signature.signature)).toBe(true);
});

test('try to verify an invalid signature', () => {
  const keychain = PaladinKeychain.create();
  expect(keychain.verify(data, 'INVALID')).toBe(false);
});

test('try to verify changed data', () => {
  const keychain = PaladinKeychain.create();
  const signature = keychain.sign(data);
  expect(keychain.verify('INVALID', signature.signature)).toBe(false);
});
