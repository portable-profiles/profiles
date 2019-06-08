# Paladin Profiles

This javascript library lets you create and manage profiles for Paladin, the distributed social network.

Create a profile:

```typescript
import { Paladin } from '@paladin-privacy/profiles';

const paladin = new Paladin();
paladin.initialize();
paladin.setField(Fields.Nickname, 'Jane', Visibility.Public);
paladin.setField(Fields.Email, 'jane@example.com', Visibility.Private);
paladin.sign();
const data = paladin.getPaladin();
```

This will create a profile (complete with its keychain), and sign the profile using the generated private key. The `data` can then be persisted to a user's machine.

The profile can be loaded back into memory with the constructor on `Paladin`.

```typescript
const data = // get the data from the file system
const paladin = new Paladin(data);
```

To share the profile with someone else, first use `filterFor`; it will strip out confidential information from the profile, such as the profile's private key, and any profile fields that are not set to share.

```typescript
import { Visibility } from '@paladin-privacy/profiles';
const toShare = paladin.filterFor(Visibility.Public);
const dataToShare = toShare.getPaladin();
```
