const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Check if Cloudinary credentials are provided in environment
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log("☁️  [Storage Service] Cloudinary remote storage enabled.");
} else {
  console.log("📁 [Storage Service] Cloudinary not configured — using local disk storage with Express static serving.");
}

/**
 * Upload a single Multer file object
 * @param {object} file - Express multer file object
 * @param {object} reqContext - { protocol, host }
 * @returns {Promise<{ url: string, path: string, isCloud: boolean, publicId?: string }>}
 */
async function uploadFile(file, reqContext = {}) {
  const localRelativePath = `uploads/${file.filename}`;
  const defaultLocalUrl = reqContext.protocol && reqContext.host
    ? `${reqContext.protocol}://${reqContext.host}/uploads/${file.filename}`
    : `/${localRelativePath}`;

  // If Cloudinary is not configured, fall back to local disk URL
  if (!isCloudinaryConfigured) {
    return {
      url: defaultLocalUrl,
      path: localRelativePath,
      isCloud: false,
    };
  }

  // Attempt Cloudinary upload
  try {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "findit_items",
      resource_type: "image",
      transformation: [
        { width: 1280, height: 1280, crop: "limit", quality: "auto" },
      ],
    });

    return {
      url: uploadResult.secure_url,
      path: localRelativePath, // Keep local copy for Python AI microservice access
      publicId: uploadResult.public_id,
      isCloud: true,
    };
  } catch (err) {
    console.warn("⚠️ [Storage Service] Cloudinary upload failed, gracefully falling back to local disk:", err.message);
    return {
      url: defaultLocalUrl,
      path: localRelativePath,
      isCloud: false,
    };
  }
}

/**
 * Upload multiple Multer files in parallel
 * @param {Array<object>} files
 * @param {object} reqContext - { protocol, host }
 * @returns {Promise<Array<{ url: string, path: string, isCloud: boolean }>>}
 */
async function uploadMultipleFiles(files, reqContext = {}) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  return Promise.all(files.map((file) => uploadFile(file, reqContext)));
}

module.exports = {
  isCloudinaryConfigured,
  uploadFile,
  uploadMultipleFiles,
};
