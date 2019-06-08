import { IVisibility } from "../models";
import { Visibility } from "../constants";
import { Profile } from "../paladin";

export class ProfileWriter {
  public static writeField(profile: Profile, key: string, value: string, visibility: IVisibility): void {
    if (visibility.mode === Visibility.Public.mode) {
      // For public, set the field directly
      profile.getProfile().body.fields[key] = {
        value,
        visibility,
      };
    } else if (visibility.mode === Visibility.Private.mode) {
      // For private, encrypt for self only
      const keychain = profile.getKeychain();
      if (keychain) {
        profile.getProfile().body.fields[key] = {
          encryption: {
            [profile.getId()]: keychain.encrypt(keychain, value)
          },
          visibility
        };
        return;
      }
      throw new Error('Keychain is required to set private fields');
    }
  }
}
