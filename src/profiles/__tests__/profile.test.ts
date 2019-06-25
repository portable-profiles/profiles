import { Visibility, Fields, defaultProfile } from '../../constants';
import * as _ from 'lodash';
import { ISignature } from '../../models';
import { Profile } from '../profile';
import { forFriends } from '../../utils/visibility';
import { fingerprint } from '../../utils/fingerprint';

test('create a basic, valid profile', () => {
  // Create a basic object
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
  expect(pl.body.id).toEqual(fingerprint(me.getCredentials()));
  expect(pl.body.revision).toEqual(1);

  // Verify get calls
  expect(me.getField(Fields.Nickname)).toEqual('Jane');
  expect(me.getField(Fields.Email)).toEqual('jane@example.com');

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
  // Alice creates her profile
  const alice = new Profile();
  alice.initialize();
  alice.setField(Fields.Nickname, 'Alice', Visibility.Public);
  alice.setField(Fields.Email, 'alice@example.com', Visibility.Private);
  alice.sign();

  // Bob receives the profile
  const bobsCopy = new Profile(alice.getProfile());

  // Try to edit using the official API
  expect(() => {
    bobsCopy.setField(Fields.Email, 'bob@example.com', Visibility.Private);
  }).toThrow();
  expect(bobsCopy.isDirty()).toBe(false);

  // Try editing by directly changing the data
  const fakeCopy = _.cloneDeep(alice.getProfile());
  fakeCopy.body.fields[Fields.Email] = {
    value: 'bob@example.com',
    visibility: Visibility.Private,
  };
  expect(() => {
    const profile = new Profile(fakeCopy);
  }).toThrow();
});

test('verify that sign requires credentials', () => {
  const profile = new Profile();
  expect(() => {
    profile.sign();
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

test('add a friend and test get', () => {
  // Create bob's profile as a friend
  const bob = new Profile();
  bob.initialize();
  bob.setField(Fields.Nickname, 'Bob', Visibility.Public);
  bob.sign();

  const eve = new Profile();
  eve.initialize();
  eve.setField(Fields.Nickname, 'Eve', Visibility.Public);
  eve.sign();

  // Create alice and add bob as a friend
  const alice = new Profile();
  alice.initialize();
  alice.addFriend(bob);
  alice.setField(Fields.Nickname, 'Alice', Visibility.Public);
  alice.setField(
    Fields.Email,
    'alice@example.com',
    forFriends([bob.toFriend()])
  );
  alice.sign();

  // Bob tries to view alice's email, and is allowed
  expect(alice.getField(Fields.Email, bob)).toEqual('alice@example.com');

  // Eve tries to view alice's email
  expect(() => {
    alice.getField(Fields.Email, eve);
  }).toThrow();

  // Check to make sure friend is listed
  expect(alice.getField(Fields.Friends)[0].id).toEqual(bob.getId());

  // Remove friend
  alice.removeFriend(bob);

  // Check to make sure friend has been removed
  expect(alice.getField(Fields.Friends)).toHaveLength(0);
});

test('create and restore a profile', () => {
  const original = new Profile();
  original.initialize();
  original.setField(Fields.Nickname, 'Alice', Visibility.Public);
  original.setField(Fields.Email, 'alice@example.com', Visibility.Public);
  original.sign();
  const { json, privateKey } = original.pack();

  // Persist the profile and private key
  // ...
  // Retrieve the profile and private key

  const copy = new Profile(JSON.parse(json), privateKey);
  copy.setField(Fields.Email, 'alice2@example.com');
  copy.sign();

  const profile = copy.getProfile();
  expect(profile.body.fields[Fields.Email].value).toEqual('alice2@example.com');
});
