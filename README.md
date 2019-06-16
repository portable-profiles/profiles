# Paladin Profiles

This javascript library lets you create and manage profiles for Paladin, the distributed social network.

## Basic usage

```typescript
import { Profile } from '@paladin-privacy/profiles';

const profile = new Profile();
profile.initialize();
profile.setField(Fields.Nickname, 'Jane', Visibility.Public);
profile.setField(Fields.Email, 'jane@example.com', Visibility.Private);
profile.sign();
const data = profile.getProfile();
```

This will create a profile (complete with its keychain), and sign the profile using the generated private key. The `data` can then be persisted to a user's machine.

The profile can be loaded back into memory with the constructor on `Profile`.

```typescript
const data = // get the data from the file system
const profile = new Profile(data);
```

To share the profile with someone else, first use `filterFor`; it will strip out confidential information from the profile, such as the profile's private key.

```typescript
import { Visibility } from '@paladin-privacy/profiles';
const toShare = profile.filterFor(Visibility.Public);
const dataToShare = profile.getProfile();
```
