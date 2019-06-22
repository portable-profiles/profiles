export enum VisibilityMode {
  Public = 'public',
  Private = 'private',
  Friends = 'friends',
}

export interface IVisibility {
  mode: VisibilityMode;
  friends?: IFriend[];
}

export interface IField {
  value?: any;
  encryption?: { [key: string]: IEncryption };
  visibility: IVisibility;
}

export interface IProfileBody {
  id: string | null;
  revision: number | null;
  fields: { [key: string]: IField };
  createdOn: number | null;
  modifiedOn: number | null;
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

export interface IProfile {
  spec: string;
  body: IProfileBody;
  signature: ISignature | null;
  publicKey: string;
}

export interface IServer {
  domain: string;
}

export interface IFriend {
  id: string;
  nickname: string;
  servers: IServer[];
  publicKey: string;
}

export interface IEncryption {
  forId?: string;
  algorithm: string;
  iv: string;
  encryptedKey: string;
  encryptedData: string;
}
