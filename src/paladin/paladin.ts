import { IPaladin, IVisibility } from '../models';
import * as _ from 'lodash';
import { defaultPaladin } from '../constants';
import { PaladinKeychain } from '../crypto/keychain';
import moment from 'moment';

export class Paladin {
  private paladin: IPaladin;

  // Indicates whether there are unsigned changes
  private dirty: boolean = false;

  constructor(paladin: IPaladin) {
    this.paladin = _.defaultsDeep(paladin, defaultPaladin);
  }

  public createCredentials() {
    this.dirty = true;
    this.paladin.credentials = PaladinKeychain.create().getCredentials();
  }

  public setField(key: string, value: string, visibility: IVisibility) {
    this.dirty = true;
    this.paladin.profile.body.fields[key] = {
      value,
      visibility,
    };
  }

  public sign() {
    if (!this.paladin.credentials) {
      throw new Error('No credentials available to sign changes with');
    }

    // Update spec version
    this.paladin.spec = defaultPaladin.spec;

    // Create a keychain from the stored credentials
    const keychain = new PaladinKeychain(this.paladin.credentials);

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
}
