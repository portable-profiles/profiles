import { IVisibility, IProfile, IFriend } from '../models';
import * as _ from 'lodash';
import { defaultProfile, Visibility, Fields } from '../constants';
import { Keychain } from '../crypto/keychain';
import { v4 } from 'uuid';
import * as moment from 'moment';
import { ProfileWriter } from '../utils/profile-writer';
import { ProfileReader } from '../utils/profile-reader';

export class Profile {
  private profile: IProfile;

  // Indicates whether there are unsigned changes
  private dirty: boolean = false;

  constructor(profile: Partial<IProfile> | null = null) {
    if (profile) {
      // If there is a profile, assign defaults and verify
      this.profile = _.defaultsDeep(profile, defaultProfile);
      if (!this.isValid()) {
        throw new Error('The signature on this profile is invalid');
      }
    } else {
      // If there isn't a profile, initialize a default
      this.profile = _.cloneDeep(defaultProfile);
    }
  }

  public isValid(): boolean {
    const profile = JSON.stringify(this.profile.body);
    const signature = this.profile.signature;
    const keychain = this.getKeychain();
    if (!keychain || !signature) {
      return false;
    }
    return keychain.verify(profile, signature);
  }

  public isDirty() {
    return this.dirty;
  }

  public initialize() {
    this.dirty = true;
    this.profile.body.id = v4();
    this.createCredentials();
    this.setField(Fields.Friends, [], Visibility.Public);
    this.setField(Fields.Servers, [], Visibility.Public);
  }

  public createCredentials() {
    this.dirty = true;
    this.profile.credentials = Keychain.create().getCredentials();
  }

  public setField(key: string, value: any, visibility?: IVisibility) {
    if (!_.get(this.profile, ['credentials', 'privateKey'])) {
      throw new Error('No credentials available to change this field');
    }
    if (!visibility) {
      visibility = this.getVisibility(key);
      if (!visibility) {
        throw new Error(
          'Visibility was not specified on call, and cannot be inferred as the field is not yet set.'
        );
      }
    }
    this.dirty = true;
    ProfileWriter.writeField(this, key, value, visibility);
  }

  public sign() {
    // Create a keychain from the stored credentials
    const keychain = this.getKeychain();
    if (!keychain) {
      throw new Error('No credentials available to sign changes with');
    }

    // Update spec version
    this.profile.spec = defaultProfile.spec;

    // Update profile metadata
    if (!this.profile.body.createdOn) {
      this.profile.body.createdOn = moment().unix();
    }

    // Increment the revision number
    if (this.profile.body.revision) {
      this.profile.body.revision += 1;
    } else {
      this.profile.body.revision = 1;
    }

    // Set modified time
    this.profile.body.modifiedOn = moment().unix();

    // Sign the profile
    const profileBody = JSON.stringify(this.profile.body);
    this.profile.signature = keychain.sign(profileBody);

    // Remove the dirty flag
    this.dirty = false;
  }

  public getProfile() {
    return this.profile;
  }

  public toString() {
    return JSON.stringify(this.profile);
  }

  public getKeychain(): Keychain | null {
    if (!this.profile.credentials) {
      return null;
    }
    return new Keychain(this.profile.credentials);
  }

  public filterFor(visibility: IVisibility): Profile {
    // Copy the data from this instance
    const data = _.cloneDeep(this.getProfile());

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
    data.body.fields = _.pickBy(
      data.body.fields,
      (v, k) =>
        v.visibility.mode === 'public' || v.visibility.mode === visibility.mode
    );

    // Sign the filtered profile
    const profileBody = JSON.stringify(data.body);
    data.signature = keychain.sign(profileBody);

    return new Profile(data);
  }

  public getId(): string {
    const id = _.get(this.profile, ['body', 'id'], null);
    if (id) {
      return id;
    }
    throw new Error('This profile does not have an ID');
  }

  public getField(key: string, me?: Profile): any {
    return ProfileReader.readField(this, key, me);
  }

  public getVisibility(key: string) {
    return _.get(
      this.getProfile(),
      ['body', 'fields', key, 'visibility'],
      null
    );
  }

  public getPublicKey() {
    return _.get(this.getProfile(), ['credentials', 'publicKey'], null);
  }

  public addFriend(friend: Profile) {
    const friends = this.getField(Fields.Friends);
    const newFriendList = [
      ...friends,
      {
        id: friend.getId(),
        nickname: friend.getField(Fields.Nickname),
        servers: friend.getField(Fields.Servers),
        publicKey: friend.getPublicKey(),
      },
    ];
    this.setField(Fields.Friends, newFriendList);
  }

  public removeFriend(friend: Profile) {
    const friends = this.getField(Fields.Friends);
    const newFriendList = _.filter(
      friends,
      (f: IFriend) => f.id !== friend.getId()
    );
    if (friends.length === newFriendList.length) {
      throw new Error(
        `The user ${friend.getId()} is not on the friend list so cannot be removed`
      );
    }
    this.setField(Fields.Friends, newFriendList);
  }

  public toFriend(): IFriend {
    return {
      id: this.getId(),
      nickname: this.getField(Fields.Nickname),
      servers: this.getField(Fields.Servers),
      publicKey: this.getPublicKey(),
    };
  }
}
