const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary (use environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (same as uploads route)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size (increased for consistency)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Function to upload to Cloudinary from file path, buffer, or base64
const uploadToCloudinary = async (input, folder = 'pickups', mimeType = 'image/jpeg') => {
  try {
    let buffer;
    let format;

    console.log('Uploading to Cloudinary:', { folder, mimeType });

    if (typeof input === 'string') {
      if (input.startsWith('data:')) {
        // Handle data URI
        const matches = input.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1] || mimeType;
          const base64 = matches[2];
          buffer = Buffer.from(base64, 'base64');
        } else {
          throw new Error('Invalid data URI format');
        }
      } else {
        // Handle plain base64 string or file path
        try {
          buffer = Buffer.from(input, 'base64');
        } catch (e) {
          // If base64 decode fails, try as file path
          try {
            buffer = fs.readFileSync(input);
            if (mimeType === 'image/jpeg') format = 'jpg';
            else if (mimeType === 'image/png') format = 'png';
          } catch (fsError) {
            console.error('File read error:', fsError);
            throw new Error('Invalid input: not a valid base64 string or file path');
          }
        }
      }
    } else if (Buffer.isBuffer(input)) {
      // Handle buffer directly
      buffer = input;
    } else {
      throw new Error('Unsupported input type for upload');
    }

    if (!buffer) {
      throw new Error('Could not create buffer from input');
    }

    // Upload to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          format: format || (mimeType.split('/')[1] || 'jpg')
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

module.exports = { upload, uploadToCloudinary };
