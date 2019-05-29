import { Paladin } from '../paladin';
import { Visibility, Fields, defaultPaladin } from '../../constants';
import * as _ from 'lodash';
import { ISignature } from '../../models';

test('create a basic, valid paladin profile', () => {
  // Create a basic paladin object
  const paladin = new Paladin();
  expect(paladin.isValid()).toBe(false);
  paladin.createCredentials();
  paladin.setField(Fields.Nickname, 'Jane', Visibility.Public);
  paladin.setField(Fields.Email, 'jane@example.com', Visibility.Private);
  paladin.sign();
  expect(paladin.isValid()).toBe(true);

  // Get the data
  const pl = paladin.getPaladin();

  // Verify a few basic properties
  expect(pl.spec).toEqual(defaultPaladin.spec);
  expect(pl.settings.chunkSize).toEqual(defaultPaladin.settings.chunkSize);

  // Verify signature
  const keychain = paladin.getKeychain();
  expect(keychain).toBeTruthy();
  if (keychain) {
    expect(
      keychain.verify(JSON.stringify(pl.profile.body), pl.profile
        .signature as ISignature)
    ).toBe(true);
  }
});

test('try to change the profile without access (which is intentionally prevented)', () => {
  // Alice creates her Paladin profile
  const paladin = new Paladin();
  paladin.createCredentials();
  paladin.setField(Fields.Nickname, 'Alice', Visibility.Public);
  paladin.setField(Fields.Email, 'alice@example.com', Visibility.Private);
  paladin.sign();

  // Get the data
  const alice = paladin.filterFor(Visibility.Public).getPaladin();

  // Bob receives the profile
  const bobsCopy = new Paladin(alice);

  // Try to edit using the official API
  expect(() => {
    bobsCopy.setField(Fields.Email, 'bob@example.com', Visibility.Private);
  }).toThrow();
  expect(bobsCopy.isDirty()).toBe(false);

  // Try editing by directly changing the data
  const fakeCopy = _.cloneDeep(alice);
  fakeCopy.profile.body.fields[Fields.Email] = {
    value: 'bob@example.com',
    visibility: Visibility.Private,
  };
  expect(() => {
    const fallenPaladin = new Paladin(fakeCopy);
  }).toThrow();
});

test('verify that sign requires credentials', () => {
  const paladin = new Paladin();
  expect(() => {
    paladin.sign();
  }).toThrow();
});

test('verify that filterFor requires credentials', () => {
  const paladin = new Paladin();
  expect(() => {
    paladin.filterFor(Visibility.Public);
  }).toThrow();
});

test('verify that sign treats createDate correctly', () => {
  const paladin = new Paladin();
  paladin.createCredentials();

  expect(() => {
    paladin.setField(Fields.Nickname, 'Alice', Visibility.Public);
    paladin.sign();
    paladin.setField(Fields.Email, 'alice@example.com', Visibility.Private);
    paladin.sign();
  }).not.toThrow();
});

test('filter for private should keep key', () => {
  const alice = new Paladin();
  alice.createCredentials();
  const filtered = alice.filterFor(Visibility.Private);
  expect((filtered.getPaladin().credentials as any).privateKey).toEqual(
    (alice.getPaladin().credentials as any).privateKey
  );
});
