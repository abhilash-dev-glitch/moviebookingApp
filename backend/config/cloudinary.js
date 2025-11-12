// Ensure environment variables are loaded
require('dotenv').config();

const cloudinary = require('cloudinary').v2;

// Debug mode - Set to true to enable detailed logging for troubleshooting
const DEBUG_CLOUDINARY = false;

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Debug: Log configuration status
if (DEBUG_CLOUDINARY) {
  console.log('☁️ [CLOUDINARY] Configuration check:');
  console.log('☁️ [CLOUDINARY] CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
  console.log('☁️ [CLOUDINARY] API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('☁️ [CLOUDINARY] API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
  console.log('☁️ [CLOUDINARY] Configured:', isCloudinaryConfigured() ? 'YES' : 'NO');
}

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Path to the file or buffer
 * @param {string} folder - Cloudinary folder name
 * @param {object} options - Additional upload options
 * @returns {Promise<object>} Upload result
 */
const uploadToCloudinary = async (filePath, folder = 'movie-booking', options = {}) => {
  try {
    // Debug: Log upload attempt
    if (DEBUG_CLOUDINARY) {
      console.log('📤 [CLOUDINARY] Upload attempt');
      console.log('📤 [CLOUDINARY] File path:', filePath);
      console.log('📤 [CLOUDINARY] Folder:', folder);
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      if (DEBUG_CLOUDINARY) console.log('❌ [CLOUDINARY] Not configured');
      throw new Error(
        'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file'
      );
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
      ...options,
    });

    // Debug: Log upload success
    if (DEBUG_CLOUDINARY) {
      console.log('✅ [CLOUDINARY] Upload successful');
      console.log('✅ [CLOUDINARY] URL:', result.secure_url);
      console.log('✅ [CLOUDINARY] Public ID:', result.public_id);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    if (DEBUG_CLOUDINARY) {
      console.log('❌ [CLOUDINARY] Upload error:', error.message);
    }
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    // Debug: Log delete attempt
    if (DEBUG_CLOUDINARY) {
      console.log('🗑️ [CLOUDINARY] Delete attempt');
      console.log('🗑️ [CLOUDINARY] Public ID:', publicId);
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    // Debug: Log delete result
    if (DEBUG_CLOUDINARY) {
      console.log('✅ [CLOUDINARY] Delete result:', result.result);
    }

    return result;
  } catch (error) {
    if (DEBUG_CLOUDINARY) {
      console.log('❌ [CLOUDINARY] Delete error:', error.message);
    }
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
};

/**
 * Upload buffer to Cloudinary (for memory storage)
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder name
 * @param {object} options - Additional upload options
 * @returns {Promise<object>} Upload result
 */
const uploadBufferToCloudinary = (buffer, folder = 'movie-booking', options = {}) => {
  return new Promise((resolve, reject) => {
    // Debug: Log buffer upload attempt
    if (DEBUG_CLOUDINARY) {
      console.log('📤 [CLOUDINARY] Buffer upload attempt');
      console.log('📤 [CLOUDINARY] Buffer size:', buffer.length, 'bytes');
      console.log('📤 [CLOUDINARY] Folder:', folder);
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      if (DEBUG_CLOUDINARY) console.log('❌ [CLOUDINARY] Not configured');
      return reject(new Error(
        'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file'
      ));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          if (DEBUG_CLOUDINARY) {
            console.log('❌ [CLOUDINARY] Buffer upload error:', error.message);
          }
          console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload file to Cloudinary'));
        } else {
          // Debug: Log upload success
          if (DEBUG_CLOUDINARY) {
            console.log('✅ [CLOUDINARY] Buffer upload successful');
            console.log('✅ [CLOUDINARY] URL:', result.secure_url);
            console.log('✅ [CLOUDINARY] Public ID:', result.public_id);
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
