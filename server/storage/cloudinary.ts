import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Initialize Cloudinary with environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dfdzk2qpu';
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryUrl = process.env.CLOUDINARY_URL;

const isConfigured = Boolean(cloudinaryUrl || (cloudName && apiKey && apiSecret));

if (isConfigured) {
  if (cloudinaryUrl) {
    cloudinary.config({
      cloudinary_api_url: cloudinaryUrl,
      secure: true,
    });
  } else {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }
  console.log('[Cloudinary] Successfully configured Cloudinary service.');
} else {
  console.warn('[Cloudinary Warning] Cloudinary environment variables are missing. Using local fallback.');
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
}

/**
 * Extracts the public_id from a Cloudinary URL.
 * Works with URLs like:
 * https://res.cloudinary.com/dfdzk2qpu/image/upload/v1725738291/aeroapk/icons/some_id.png
 */
export function extractPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    // Find the marker "/image/upload/"
    const marker = '/image/upload/';
    const index = url.indexOf(marker);
    if (index === -1) return null;

    let remaining = url.substring(index + marker.length);

    // Remove the version segment (e.g., "v123456789/") if present
    if (remaining.startsWith('v')) {
      const nextSlash = remaining.indexOf('/');
      if (nextSlash !== -1) {
        const potentialVersion = remaining.substring(1, nextSlash);
        if (!isNaN(Number(potentialVersion))) {
          remaining = remaining.substring(nextSlash + 1);
        }
      }
    }

    // Strip out the file extension (e.g. .png, .jpg)
    const lastDot = remaining.lastIndexOf('.');
    if (lastDot !== -1) {
      remaining = remaining.substring(0, lastDot);
    }

    return remaining;
  } catch (err) {
    console.error('[Cloudinary] Error extracting public_id:', err);
    return null;
  }
}

export class CloudinaryService {
  /**
   * Upload a file buffer to Cloudinary with secure settings and folder organization.
   * If Cloudinary is missing or fails, falls back gracefully to a fully functional local disk storage.
   */
  static async uploadImage(
    buffer: Buffer,
    type: 'icon' | 'screenshot' | 'banner' | 'avatar' | string,
    originalName?: string
  ): Promise<CloudinaryUploadResult> {
    const saveLocally = async (): Promise<CloudinaryUploadResult> => {
      try {
        const imagesDir = path.join(process.cwd(), 'uploads', 'images');
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }
        const ext = originalName ? path.extname(originalName).toLowerCase() : '.png';
        const filename = `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
        const filePath = path.join(imagesDir, filename);
        
        await fs.promises.writeFile(filePath, buffer);
        console.log(`[Cloudinary Local Fallback] Successfully saved image locally to: ${filePath}`);
        
        return {
          secure_url: `/uploads/images/${filename}`,
          public_id: `local_${filename}`,
          format: ext.replace('.', ''),
          width: 512,
          height: 512,
          resource_type: 'image'
        };
      } catch (localErr: any) {
        console.error('[Cloudinary Local Fallback Error] Failed to save image locally:', localErr);
        throw new Error(`Failed to upload image locally: ${localErr.message}`);
      }
    };

    if (!isConfigured) {
      console.warn('[Cloudinary Warning] Cloudinary environment variables are missing. Using local fallback.');
      return saveLocally();
    }

    // Determine target folder based on image type
    let folder = 'aeroapk/uploads';
    if (type === 'icon') {
      folder = 'aeroapk/icons';
    } else if (type === 'screenshot') {
      folder = 'aeroapk/screenshots';
    } else if (type === 'banner') {
      folder = 'aeroapk/banners';
    } else if (type === 'avatar') {
      folder = 'aeroapk/avatars';
    }

    const uniqueId = `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    try {
      return await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: uniqueId,
            overwrite: true,
            resource_type: 'image',
            // Optimizations requested: auto quality & auto format delivery
            transformation: [
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error || !result) {
              // Log the specific error without treating it as a fatal crash of the upload pipeline
              console.warn('[Cloudinary] Upload stream failed, attempting local fallback:', error?.message || 'Unknown error');
              return reject(error || new Error('Upload returned empty result.'));
            }

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              resource_type: result.resource_type,
            });
          }
        );

        uploadStream.end(buffer);
      });
    } catch (streamErr: any) {
      console.log('[Cloudinary] Cloudinary upload unsuccessful. Using local fallback storage.');
      return saveLocally();
    }
  }

  /**
   * Deletes an image from Cloudinary using its secure URL.
   * Also supports deleting local fallback files if applicable.
   */
  static async deleteImage(url: string): Promise<boolean> {
    if (url.startsWith('/uploads/')) {
      try {
        const relativePath = url.replace(/^\/uploads\//, '');
        const filePath = path.join(process.cwd(), 'uploads', relativePath.replace(/\//g, path.sep));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[Cloudinary Local Fallback] Deleted local fallback image: ${filePath}`);
          return true;
        }
        return false;
      } catch (err) {
        console.error('[Cloudinary Local Fallback] Failed to delete local image:', err);
        return false;
      }
    }

    const publicId = extractPublicId(url);
    if (!publicId) {
      console.log('[Cloudinary] Skipping deletion: URL is not a valid Cloudinary asset URL.', url);
      return false;
    }

    if (!isConfigured) {
      console.warn('[Cloudinary] Cannot delete: Cloudinary is not configured.');
      return false;
    }

    try {
      const response = await cloudinary.uploader.destroy(publicId);
      console.log(`[Cloudinary] Deletion response for ${publicId}:`, response);
      return response.result === 'ok';
    } catch (err) {
      console.error(`[Cloudinary] Failed to delete image ${publicId}:`, err);
      return false;
    }
  }
}
