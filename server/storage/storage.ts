import path from 'path';
import fs from 'fs';
import { APKStorage, CreateUploadUrlInput, UploadUrlResult, CompleteUploadInput, UploadResult, StorageObjectMetadata, DownloadOptions } from './types';

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
}

/**
 * Clean Local/Direct URL Storage Handler
 */
export class LocalStorageProvider implements APKStorage {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'uploads', 'apks');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async createUploadUrl(input: CreateUploadUrlInput): Promise<UploadUrlResult> {
    const objectKey = `apks/${Date.now()}_${sanitizeFileName(input.fileName)}`;
    return {
      uploadId: input.uploadId,
      objectKey,
      uploadUrl: `/api/upload/apk/${input.uploadId}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    };
  }

  async completeUpload(input: CompleteUploadInput): Promise<UploadResult> {
    return {
      objectKey: input.objectKey,
      size: 0,
      hash: ''
    };
  }

  async getMetadata(objectKey: string): Promise<StorageObjectMetadata | null> {
    const filePath = path.join(process.cwd(), 'uploads', objectKey.replace(/\//g, path.sep));
    if (!fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    return {
      key: objectKey,
      size: stats.size,
      contentType: 'application/vnd.android.package-archive',
      eTag: `"${stats.mtimeMs}"`,
      lastModified: stats.mtime
    };
  }

  async createDownloadUrl(objectKey: string, options?: DownloadOptions): Promise<string> {
    return `/uploads/${objectKey}`;
  }

  async deleteObject(objectKey: string): Promise<void> {
    const filePath = path.join(process.cwd(), 'uploads', objectKey.replace(/\//g, path.sep));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async moveObject(sourceKey: string, destinationKey: string): Promise<void> {
    const src = path.join(process.cwd(), 'uploads', sourceKey.replace(/\//g, path.sep));
    const dest = path.join(process.cwd(), 'uploads', destinationKey.replace(/\//g, path.sep));
    if (fs.existsSync(src)) {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.renameSync(src, dest);
    }
  }

  async exists(objectKey: string): Promise<boolean> {
    const filePath = path.join(process.cwd(), 'uploads', objectKey.replace(/\//g, path.sep));
    return fs.existsSync(filePath);
  }
}

export const storage: APKStorage = new LocalStorageProvider();
export * from './types';
export * from './cloudinary';

