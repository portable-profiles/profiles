export const software = '@paladin-privacy/profiles';
export const version = '0.0.1';

export const defaultPaladin = {
  spec: `${software}:${version}`,
  profile: {
    body: {
      id: null,
      revision: null,
      fields: [],
      createdOn: null,
      modifiedOn: null,
    },
    signature: null,
  },
  settings: {
    chunkSize: 10,
  },
};
