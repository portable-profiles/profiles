import { IVisibility, IProfile, IFriend, ICredentials } from '../models';
import * as _ from 'lodash';
import { defaultProfile, Visibility, Fields } from '../constants';
import { Keychain } from '../crypto/keychain';
import { v4 } from 'uuid';
import * as moment from 'moment';
import { ProfileWriter } from '../utils/profile-writer';
import { ProfileReader } from '../utils/profile-reader';
import { fingerprint } from '../utils/fingerprint';

export class Profile {
  private profile: IProfile;
  private credentials?: ICredentials;

  // Indicates whether there are unsigned changes
  private dirty: boolean = false;

  constructor(profile?: Partial<IProfile>, privateKey?: string) {
    if (profile) {
      // If there is a profile, assign defaults and verify
      this.credentials = { publicKey: profile.publicKey, privateKey };
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
    this.createCredentials();
    this.profile.body.id = fingerprint(this.credentials);
    this.setField(Fields.Friends, [], Visibility.Public);
    this.setField(Fields.Servers, [], Visibility.Public);
  }

  public createCredentials() {
    this.dirty = true;
    this.credentials = Keychain.create().getCredentials();
    this.profile.publicKey = this.credentials.publicKey as string;
  }

  public setField(key: string, value: any, visibility?: IVisibility) {
    if (!this.getPrivateKey()) {
      throw new Error('No credentials available to change this field');
    }

    // If no visibility is provided, use existing. If neither, error
    if (!visibility) {
      visibility = this.getVisibility(key);
      if (!visibility) {
        throw new Error(
          'Visibility was not specified on call, and cannot be inferred as the field is not yet set.'
        );
      }
    }

    // Mark as dirty and write field
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

  public pack(): { json: string; privateKey: string } {
    const privateKey = this.getPrivateKey();
    if (!privateKey) {
      throw new Error('Private key not found');
    }
    return {
      json: this.toString(),
      privateKey,
    };
  }

  public toString() {
    return JSON.stringify(this.profile);
  }

  public getKeychain(): Keychain | null {
    if (!this.credentials) {
      return null;
    }
    return new Keychain(this.credentials);
  }

  public getCredentials(): ICredentials | undefined {
    return this.credentials;
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

  public getVisibility(key: string): IVisibility {
    return _.get(
      this.getProfile(),
      ['body', 'fields', key, 'visibility'],
      null
    );
  }

  public getPublicKey(): string | null {
    return _.get(this.credentials, ['publicKey'], null);
  }

  public getPrivateKey(): string | null {
    return _.get(this.credentials, ['privateKey'], null);
  }

  public addFriend(friend: Profile): void {
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

  public removeFriend(friend: Profile): void {
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
    const publicKey = this.getPublicKey();
    if (!publicKey) {
      throw new Error('Public key required for this action');
    }
    return {
      id: this.getId(),
      nickname: this.getField(Fields.Nickname),
      servers: this.getField(Fields.Servers),
      publicKey,
    };
  }
}
