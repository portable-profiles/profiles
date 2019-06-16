import { Profile } from '../paladin';
import * as _ from 'lodash';
import { VisibilityMode } from '../models';

export class ProfileReader {
  public static readField(
    profile: Profile,
    key: string,
    me?: Profile
  ): string | null {
    const field = _.get(profile.getProfile(), ['body', 'fields', key]);
    if (!field) {
      return null;
    }

    if (field.visibility.mode === VisibilityMode.Public) {
      // For public fields, return the value
      if (field.value) {
        return field.value;
      }
      throw new Error(
        'Malformed field; visibility is public but no value specified'
      );
    } else if (field.visibility.mode === VisibilityMode.Private) {
      // For private fields, decrypt the value
      if (me && me.getId() !== profile.getId()) {
        throw new Error(
          'You do not have permission to read this private field'
        );
      }
      const keychain = profile.getKeychain();
      if (!keychain) {
        throw new Error('Keychain is required to read private fields');
      }
      const encryption = _.get(field, ['encryption', profile.getId()], null);
      if (!encryption) {
        throw new Error(
          'Malformed field; visibility is private but encryption could not be found.'
        );
      }
      return keychain.decrypt(encryption);
    } else if (field.visibility.mode === VisibilityMode.Friends) {
      if (!me) {
        throw new Error(
          'This field is set to friends only, so must be accessed with context of another user'
        );
      }
      const share = _.get(field, ['encryption', me.getId()], null);
      if (!share) {
        throw new Error('This field is not shared with you');
      }
      const keychain = me.getKeychain();
      if (!keychain) {
        throw new Error('Keychain is required to read friend fields');
      }
      return keychain.decrypt(share);
    }
    throw new Error('Could not recognize field visibility');
  }
}
