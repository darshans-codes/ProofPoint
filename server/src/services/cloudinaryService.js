import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials are present
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[Cloudinary] Configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.warn('[Cloudinary] Credentials not fully configured. Fallback storage mode enabled.');
}

export function buildTransformations(publicId, projectName = 'ProofPoint', resourceType = 'image') {
  const sanitizedProjectName = (projectName || 'ProofPoint')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim() || 'ProofPoint';

  if (!isConfigured) {
    // Demo fallback URLs if cloud not configured
    return {
      thumb: publicId,
      medium: publicId,
      watermarked: publicId,
      poster: resourceType === 'video' ? publicId : null,
    };
  }

  if (resourceType === 'video') {
    const poster = cloudinary.url(publicId, {
      resource_type: 'video',
      secure: true,
      format: 'jpg',
      start_offset: '0',
    });
    return {
      thumb: poster,
      medium: poster,
      watermarked: poster,
      poster,
    };
  }

  const thumb = cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    transformation: [
      { width: 400, height: 300, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  const medium = cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    transformation: [
      { width: 1000, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  const watermarked = cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    transformation: [
      { width: 1000, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
      {
        overlay: {
          font_family: 'Arial',
          font_size: 28,
          text: sanitizedProjectName,
        },
        color: 'white',
        opacity: 60,
        gravity: 'south_east',
        x: 20,
        y: 20,
      },
    ],
  });

  return {
    thumb,
    medium,
    watermarked,
    poster: null,
  };
}

export async function uploadToCloudinary(buffer, { folder = 'proofpoint', resource_type = 'auto', filename = '' } = {}) {
  if (!isConfigured) {
    // Generate data URL or local placeholder for testing without cloud credentials
    const mime = resource_type === 'video' ? 'video/mp4' : 'image/jpeg';
    const base64 = buffer.toString('base64');
    const dataUri = `data:${mime};base64,${base64}`;
    const publicId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      public_id: publicId,
      url: dataUri,
      secure_url: dataUri,
      width: 1200,
      height: 900,
      format: 'jpg',
      bytes: buffer.length,
      resource_type: resource_type === 'video' ? 'video' : 'image',
    };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
      },
      (err, result) => {
        if (err) {
          console.error('[Cloudinary] Upload error:', err);
          return reject(err);
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function destroyFromCloudinary(publicId, resource_type = 'image') {
  if (!isConfigured || publicId.startsWith('local_')) {
    return { result: 'ok' };
  }
  return cloudinary.uploader.destroy(publicId, { resource_type });
}
