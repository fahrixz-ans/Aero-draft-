import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

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
   */
  static async uploadImage(
    buffer: Buffer,
    type: 'icon' | 'screenshot' | 'banner' | 'avatar' | string
  ): Promise<CloudinaryUploadResult> {
    if (!isConfigured) {
      throw new Error('Cloudinary is not configured. Please supply CLOUDINARY_URL in your environment.');
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

    return new Promise((resolve, reject) => {
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
            console.error('[Cloudinary] Upload stream error:', error);
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
  }

  /**
   * Deletes an image from Cloudinary using its secure URL.
   */
  static async deleteImage(url: string): Promise<boolean> {
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
