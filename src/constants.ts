import { IVisibility, IProfile } from './models';

export const software = '@paladin-privacy/profiles';
export const version = '0.0.1';

export const defaultProfile: IProfile = {
  spec: `${software}:${version}`,
  body: {
    id: null,
    revision: null,
    fields: {},
    friends: [],
    createdOn: null,
    modifiedOn: null,
  },
  signature: null,
};

export const Fields = {
  Nickname: 'nickname',
  Email: 'email',
};

export const Visibility: { [key: string]: IVisibility } = {
  Public: { mode: 'public' },
  Private: { mode: 'private' },
};
