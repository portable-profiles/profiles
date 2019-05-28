import { IPaladin, IVisibility } from '../models';
import * as _ from 'lodash';
import { defaultPaladin, Visibility } from '../constants';
import { PaladinKeychain } from '../crypto/keychain';
import moment from 'moment';

export class Paladin {
  private paladin: IPaladin;

  // Indicates whether there are unsigned changes
  private dirty: boolean = false;

  constructor(paladin: Partial<IPaladin> | null = null) {
    if (paladin) {
      // If there is a profile, assign defaults and verify
      this.paladin = _.defaultsDeep(paladin, defaultPaladin);
      if (!this.isValid()) {
        throw new Error('The signature on this profile is invalid');
      }
    } else {
      // If there isn't a profile, initialize a default
      this.paladin = _.cloneDeep(defaultPaladin);
    }
  }

  public isValid(): boolean {
    const profile = JSON.stringify(this.paladin.profile.body);
    const signature = this.paladin.profile.signature;
    const keychain = this.getKeychain();
    if (!keychain || !signature) {
      return false;
    }
    return keychain.verify(profile, signature);
  }

  public isDirty() {
    return this.dirty;
  }

  public createCredentials() {
    this.dirty = true;
    this.paladin.credentials = PaladinKeychain.create().getCredentials();
  }

  public setField(key: string, value: string, visibility: IVisibility) {
    if (!_.get(this.paladin, ['credentials', 'privateKey'])) {
      throw new Error('No credentials available to change this field');
    }
    this.dirty = true;
    this.paladin.profile.body.fields[key] = {
      value,
      visibility,
    };
  }

  public sign() {
    // Create a keychain from the stored credentials
    const keychain = this.getKeychain();
    if (!keychain) {
      throw new Error('No credentials available to sign changes with');
    }

    // Update spec version
    this.paladin.spec = defaultPaladin.spec;

    // Update profile metadata
    if (!this.paladin.profile.body.createdOn) {
      this.paladin.profile.body.createdOn = moment().unix();
    }
    this.paladin.profile.body.modifiedOn = moment().unix();

    // Sign the profile
    const profileBody = JSON.stringify(this.paladin.profile.body);
    this.paladin.profile.signature = keychain.sign(profileBody);

    // Remove the dirty flag
    this.dirty = false;
  }

  public getPaladin() {
    return this.paladin;
  }

  public getKeychain(): PaladinKeychain | null {
    if (!this.paladin.credentials) {
      return null;
    }
    return new PaladinKeychain(this.paladin.credentials);
  }

  public filterFor(visibility: IVisibility): Paladin {
    // Copy the data from this instance
    const data = _.cloneDeep(this.getPaladin());

    // Get a keychain and make sure that it can sign
    const keychain = this.getKeychain();
    if (!keychain) {
      throw new Error('No credentials available to sign a filtered copy');
    }

    // Hide private key unless filtering for private/self
    if (visibility.mode !== Visibility.Private.mode) {
      data.credentials = {
        publicKey: _.get(data, ['credentials', 'publicKey']),
      };
    }

    // Hide profile fields that are concealed from this visibility
    data.profile.body.fields = _.pickBy(
      data.profile.body.fields,
      (v, k) =>
        v.visibility.mode === 'public' || v.visibility.mode === visibility.mode
    );

    // Sign the filtered profile
    const profileBody = JSON.stringify(data.profile.body);
    data.profile.signature = keychain.sign(profileBody);

    return new Paladin(data);
  }
}
