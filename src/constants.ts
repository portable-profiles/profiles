import { IVisibility, IPaladin } from './models';

export const software = '@paladin-privacy/profiles';
export const version = '0.0.1';

export const defaultPaladin: IPaladin = {
  spec: `${software}:${version}`,
  profile: {
    body: {
      id: null,
      revision: null,
      fields: {},
      createdOn: null,
      modifiedOn: null,
    },
    signature: null,
  },
  settings: {
    chunkSize: 10,
  },
};

export const Fields = {
  Nickname: 'nickname',
  Email: 'email',
};

export const Visibility: { [key: string]: IVisibility } = {
  Public: { mode: 'public' },
  Private: { mode: 'private' },
};
