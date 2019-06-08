import { IVisibility } from "../models";
import { Visibility } from "../constants";
import { Profile } from "../paladin";
import * as _ from 'lodash';

export class ProfileReader {
  public static readField(profile: Profile, key: string, me?: Profile): string | null {
    const field = _.get(profile.getProfile(), ['body', 'fields', key]);
    if (!field) {
      return null;
    }

    if (field.visibility.mode === Visibility.Public.mode) {
      // For public fields, return the value
      if (field.value) {
        return field.value;
      }
      throw new Error('Malformed field; visibility is public but no value specified');
    } else if (field.visibility.mode === Visibility.Private.mode) {
      // For private fields, decrypt the value
      if (me && me.getId() !== profile.getId()) {
        throw new Error('You do not have permission to read this private field');
      }
      const keychain = profile.getKeychain();
      if (!keychain) {
        throw new Error('Keychain is required to read private fields');
      }
      const encryption = _.get(field, ['encryption', profile.getId()], null);
      if (!encryption) {
        throw new Error('Malformed field; visibility is private but encryption could not be found.');
      }
      return keychain.decrypt(encryption);
    }
    throw new Error('Could not recognize field visibility');
  }
}
