# Portable Profiles

This javascript library lets you create and manage profiles for Paladin, the decentralized social network.

## Basic usage

```typescript
import { Profile, Fields, Visibility } from '@portable-profiles/profiles';

const profile = new Profile();
profile.initialize();
profile.setField(Fields.Nickname, 'Alice', Visibility.Public);
profile.setField(Fields.Email, 'alice@example.com', Visibility.Private);
profile.sign();
const { json, privateKey } = profile.pack();
```

This will create a profile (complete with its keychain), and sign the profile using the generated private key. The `data` can then be persisted to a user's machine.

The profile can be loaded back into memory with the constructor on `Profile`.

```typescript
const data = // get the data from the file system
const profile = new Profile(data);
```

To share the profile with someone else, first use `filterFor`; it will strip out confidential information from the profile, such as the profile's private key.

```typescript
import { Visibility } from '@portable-profiles/profiles';
const toShare = profile.filterFor(Visibility.Public);
const dataToShare = profile.getProfile();
```

Add friends and encrypt data for them only:

```typescript
import { Profile, Fields, Visibility, forFriends } from '@portable-profiles/profiles';

const alice = new Profile();
alice.setField(Fields.Nickname, 'Alice', Visibility.Public);
alice.sign();

const bob = new Profile();
bob.addFriend(alice);
bob.setField(Fields.Nickname, 'Bob', Visibility.Public);
bob.setField(Fields.Email, 'bob@example.org', forFriends([ alice.toFriend() ]));

console.log(bob.getField(Fields.Email, alice));
// Result: bob@example.org
```
