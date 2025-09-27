const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect, restrictTo } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Configure and validate Cloudinary credentials
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary credentials not found in environment variables');
  console.error('Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary connection
cloudinary.api.ping()
  .then(() => console.log('✅ Cloudinary connection successful'))
  .catch(error => {
    console.error('❌ Cloudinary connection failed:', error.message);
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB limit
    files: 1, // Only one file at a time
    fieldSize: 10 * 1024 * 1024 // 10MB field size limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept jpeg and png
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
  }
});

// Handle document upload
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Quick validation of file size
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }

    console.log('Processing image upload:', {
      mimetype: req.file.mimetype,
      size: Math.round(req.file.size / 1024) + 'KB',
      userId: req.user.id
    });

    // Upload to Cloudinary by streaming the buffer with timeout
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Cloudinary upload timed out'));
      }, 60000); // 60 second timeout for Cloudinary

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'delivery_documents',
          resource_type: 'auto',
        },
        (error, result) => {
          clearTimeout(timeout);
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          if (!result || !result.secure_url || !result.public_id) {
            console.error('Cloudinary upload failed: invalid result', result);
            return reject(new Error('Cloudinary upload failed: invalid result'));
          }
          console.log('Cloudinary upload result:', {
            publicId: result.public_id,
            url: result.secure_url
          });
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    console.log('Cloudinary upload result:', {
      publicId: result.public_id,
      url: result.secure_url
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload document'
    });
  }
});

// Update document info in database
router.post('/document-info', protect, async (req, res) => {
  try {
    const { documentType, cloudinaryUrl, publicId } = req.body;
    const userId = req.user.id;

    if (!cloudinaryUrl || !publicId) {
      return res.status(400).json({
        success: false,
        message: 'Missing cloudinaryUrl or publicId'
      });
    }

    console.log('Updating document info:', {
      userId,
      documentType,
      cloudinaryUrl,
      publicId
    });

    // Update the user's document info, converting documents to object if needed
    const updateResult = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          documents: {
            [documentType]: {
              url: cloudinaryUrl,
              publicId: publicId,
              verified: false,
              uploadedAt: new Date()
            }
          }
        }
      },
      { new: true }
    );

    if (!updateResult) {
      throw new Error('User not found');
    }

    console.log('Document info updated successfully');

    res.json({
      success: true,
      message: 'Document info saved successfully'
    });
  } catch (error) {
    console.error('Error saving document info:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save document info'
    });
  }
});

// Delete file from Cloudinary
router.post('/delete', protect, async (req, res) => {
  try {
    const { publicId } = req.body;
    
    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      throw new Error('Failed to delete file from Cloudinary');
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

module.exports = router;