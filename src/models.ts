export interface IVisibility {
  mode: 'public' | 'private';
}

export interface IField {
  value: any;
  visibility: IVisibility;
}

export interface IProfileBody {
  id: string | null;
  revision: number | null;
  fields: { [key: string]: IField };
  createdOn: number | null;
  modifiedOn: number | null;
}

export interface IProfile {
  body: IProfileBody;
  signature: ISignature | null;
}

export interface ISignature {
  signature: string;
}

export interface ICredentials {
  privateKey?: string;
  publicKey?: string;
}

export interface IStatus {
  message: string;
  createdOn: string;
  modifiedOn: string;
}

export interface IFeedChunkBody {
  id: string;
  contents: IStatus[];
}

export interface IFeedChunk {
  body: IFeedChunkBody;
  signature: ISignature;
}

export interface IFeed {
  chunks: IFeedChunk[];
}

export interface ISettings {
  chunkSize: number;
}

export interface IPaladin {
  spec: string;
  profile: IProfile;
  feed?: IFeed;
  credentials?: ICredentials;
  settings: ISettings;
}
