export interface CreateUploadUrlInput {
  uploadId: string;
  fileName: string;
  contentType: string;
  expectedSize: number;
}

export interface UploadUrlResult {
  uploadId: string;
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface CompleteUploadInput {
  uploadId: string;
  objectKey: string;
}

export interface UploadResult {
  objectKey: string;
  size: number;
  hash: string; // SHA-256
}

export interface StorageObjectMetadata {
  key: string;
  size: number;
  contentType: string;
  eTag: string;
  lastModified: Date;
  md5Hash?: string;
}

export interface DownloadOptions {
  expiresInSeconds?: number;
  filename?: string;
}

export interface APKStorage {
  createUploadUrl(input: CreateUploadUrlInput): Promise<UploadUrlResult>;
  completeUpload(input: CompleteUploadInput): Promise<UploadResult>;
  getMetadata(objectKey: string): Promise<StorageObjectMetadata | null>;
  createDownloadUrl(objectKey: string, options?: DownloadOptions): Promise<string>;
  deleteObject(objectKey: string): Promise<void>;
  moveObject(sourceKey: string, destinationKey: string): Promise<void>;
  exists(objectKey: string): Promise<boolean>;
}
