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
router.post('/image', protect, (req, res, next) => {
  console.log('Upload request received:', {
    headers: req.headers,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    userId: req.user?.id
  });
  next();
}, upload.single('image'), async (req, res) => {
  try {
    // Log detailed request info
    console.log('Processing upload request:', {
      file: req.file ? {
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? 'Present' : 'Missing'
      } : 'No file',
      body: req.body,
      userId: req.user?.id
    });

    if (!req.file) {
      console.error('Upload failed: No file in request');
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

    // Validate file size and type
    if (req.file.size > 10 * 1024 * 1024) {
      console.error('Upload failed: File too large', {
        size: req.file.size,
        limit: 10 * 1024 * 1024
      });
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }

    if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
      console.error('Upload failed: Invalid file type', {
        mimetype: req.file.mimetype
      });
      return res.status(400).json({
        success: false,
        message: 'Only JPEG and PNG images are allowed'
      });
    }

    console.log('Starting Cloudinary upload...');

    // Upload to Cloudinary by streaming the buffer with timeout
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('Cloudinary upload timed out');
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
    console.log('Received document-info request:', {
      body: req.body,
      userId: req.user ? req.user.id : 'No user',
      headers: {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        contentType: req.headers['content-type']
      }
    });

  const { documentType, cloudinaryUrl, publicId: publicIdDoc } = req.body;
    try {
      console.log('Received document-info request:', {
        body: req.body,
        userId: req.user ? req.user.id : 'No user',
        headers: {
          authorization: req.headers.authorization ? 'Present' : 'Missing',
          contentType: req.headers['content-type']
        }
      });

      const { documentType, cloudinaryUrl, publicId } = req.body;
      const userId = req.user?.id;

      if (!documentType) {
        console.error('Missing documentType in request');
        return res.status(400).json({ success: false, message: 'Missing documentType' });
      }
      if (!cloudinaryUrl || !publicIdDoc) {
        console.error('Missing cloudinaryUrl or publicId in request');
        return res.status(400).json({ success: false, message: 'Missing cloudinaryUrl or publicId' });
      }
      if (!userId) {
        console.error('Missing userId in request');
        return res.status(401).json({ success: false, message: 'Unauthorized: No userId' });
      }

      console.log('Updating document info:', {
        userId,
        documentType,
        cloudinaryUrl,
        publicId
      });

      // Find the user first to check if documents field exists
      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found for userId:', userId);
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Ensure documents field is an object
      if (!user.documents) {
        user.documents = {};
      }

      // Update the specific document info
      user.documents[documentType] = {
        url: cloudinaryUrl,
        publicId: publicIdDoc,
        verified: false,
        uploadedAt: new Date()
      };

      await user.save();

      console.log('Document info updated successfully for user:', userId);

      res.json({
        success: true,
        message: 'Document info saved successfully'
      });
    } catch (error) {
      console.error('Error saving document info:', {
        message: error.message,
        stack: error.stack,
        userId: req.user ? req.user.id : 'No user',
        body: req.body
      });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to save document info'
      });
    }
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