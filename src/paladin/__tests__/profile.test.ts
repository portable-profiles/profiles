import { Visibility, Fields, defaultProfile } from '../../constants';
import * as _ from 'lodash';
import { ISignature } from '../../models';
import { Profile } from '../profile';

const MOCK_UUID = 'MOCK_UUID';
jest.mock('uuid/v4', () => ({
  __esModule: true,
  default: () => MOCK_UUID,
}));

test('create a basic, valid paladin profile', () => {
  // Create a basic paladin object
  const me = new Profile();
  expect(me.isValid()).toBe(false);
  me.initialize();
  me.setField(Fields.Nickname, 'Jane', Visibility.Public);
  me.setField(Fields.Email, 'jane@example.com', Visibility.Private);
  me.sign();
  expect(me.isValid()).toBe(true);

  // Get the data
  const pl = me.getProfile();

  // Verify a few basic properties
  expect(pl.spec).toEqual(defaultProfile.spec);
  expect(pl.body.id).toEqual(MOCK_UUID);
  expect(pl.body.revision).toEqual(1);

  // Verify signature
  const keychain = me.getKeychain();
  expect(keychain).toBeTruthy();
  if (keychain) {
    expect(
      keychain.verify(JSON.stringify(pl.body), pl.signature as ISignature)
    ).toBe(true);
  }
});

test('try to change the profile without access (which is intentionally prevented)', () => {
  // Alice creates her Paladin profile
  const me = new Profile();
  me.initialize();
  me.setField(Fields.Nickname, 'Alice', Visibility.Public);
  me.setField(Fields.Email, 'alice@example.com', Visibility.Private);
  me.sign();

  // Get the data
  const alice = me.filterFor(Visibility.Public).getProfile();

  // Bob receives the profile
  const bobsCopy = new Profile(alice);

  // Try to edit using the official API
  expect(() => {
    bobsCopy.setField(Fields.Email, 'bob@example.com', Visibility.Private);
  }).toThrow();
  expect(bobsCopy.isDirty()).toBe(false);

  // Try editing by directly changing the data
  const fakeCopy = _.cloneDeep(alice);
  fakeCopy.body.fields[Fields.Email] = {
    value: 'bob@example.com',
    visibility: Visibility.Private,
  };
  expect(() => {
    const fallenPaladin = new Profile(fakeCopy);
  }).toThrow();
});

test('verify that sign requires credentials', () => {
  const profile = new Profile();
  expect(() => {
    profile.sign();
  }).toThrow();
});

test('verify that filterFor requires credentials', () => {
  const profile = new Profile();
  expect(() => {
    profile.filterFor(Visibility.Public);
  }).toThrow();
});

test('verify multiple revisions', () => {
  const profile = new Profile();
  profile.initialize();

  expect(() => {
    // First revision
    profile.setField(Fields.Nickname, 'Alice', Visibility.Public);
    profile.sign();
    expect(profile.getProfile().body.revision).toEqual(1);

    // Second revision
    profile.setField(Fields.Email, 'alice@example.com', Visibility.Private);
    profile.sign();
    expect(profile.getProfile().body.revision).toEqual(2);
  }).not.toThrow();
});

test('filter for private should keep key', () => {
  const alice = new Profile();
  alice.initialize();
  const filtered = alice.filterFor(Visibility.Private);
  expect((filtered.getProfile().credentials as any).privateKey).toEqual(
    (alice.getProfile().credentials as any).privateKey
  );
});
