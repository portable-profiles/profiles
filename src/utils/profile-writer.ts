import { IVisibility, VisibilityMode } from '../models';
import { Profile } from '../paladin';
import * as _ from 'lodash';
import { PaladinKeychain } from '../crypto';

export class ProfileWriter {
  public static writeField(
    profile: Profile,
    key: string,
    value: any,
    visibility: IVisibility
  ): void {
    if (visibility.mode === VisibilityMode.Public) {
      // For public, set the field directly
      profile.getProfile().body.fields[key] = {
        value,
        visibility,
      };
    } else if (visibility.mode === VisibilityMode.Private) {
      // For private, encrypt for self only
      const keychain = profile.getKeychain();
      if (!keychain) {
        throw new Error('Keychain is required to set private fields');
      }
      profile.getProfile().body.fields[key] = {
        encryption: {
          [profile.getId()]: keychain.encrypt(keychain, value),
        },
        visibility,
      };
    } else if (visibility.mode === VisibilityMode.Friends) {
      // For friends, encrypt for the recipients
      const keychain = profile.getKeychain();
      if (!keychain) {
        throw new Error('Keychain is required to set private fields');
      }
      const encryption = _.reduce(
        visibility.friends,
        (r, v) => ({
          ...r,
          [v.id]: keychain.encrypt(
            new PaladinKeychain({ publicKey: v.publicKey }),
            value
          ),
        }),
        {
          [profile.getId()]: keychain.encrypt(keychain, value),
        }
      );
      profile.getProfile().body.fields[key] = {
        encryption,
        visibility,
      };
    }
  }
}
