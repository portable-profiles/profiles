export interface IVisibility {}

export interface IField {
  value: any;
  visibility: IVisibility;
}

export interface IProfileBody {
  id: string;
  revision: number;
  fields: { [key: string]: IField };
  createdOn: number;
  modifiedOn: number;
}

export interface IProfile {
  body: IProfileBody;
  signature: ISignature;
}

export interface ISignature {
  signature: string;
}

export interface ICredentials {
  privateKey: string;
  publicKey: string;
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
