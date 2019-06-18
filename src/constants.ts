import { IVisibility, IProfile, IFriend, VisibilityMode } from './models';

export const software = '@portable-profiles/profiles';
export const version = '0.0.1';

export const defaultProfile: IProfile = {
  spec: `${software}:${version}`,
  body: {
    id: null,
    revision: null,
    fields: {},
    createdOn: null,
    modifiedOn: null,
  },
  signature: null,
};

export const Fields = {
  Nickname: '_nickname',
  Email: '_email',
  Friends: '_friends',
  Servers: '_servers',
};

export const Visibility: { [key: string]: IVisibility } = {
  Public: { mode: VisibilityMode.Public },
  Private: { mode: VisibilityMode.Private },
};
