const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect, restrictTo } = require('../middleware/auth');

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
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    console.log('Received upload request:', {
      contentType: req.headers['content-type'],
      fileInfo: req.file ? {
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file'
    });
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file provided'
      });
    }

    // Convert buffer to base64
    const base64String = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64String}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataUri, {
      folder: 'cleangreen/waste-images',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    res.status(200).json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: {
        imageUrl: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        width: uploadResponse.width,
        height: uploadResponse.height
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload image',
      details: error.message
    });
  }
});

router.post('/multiple', protect, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No image files provided'
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const base64String = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64String}`;

      return await cloudinary.uploader.upload(dataUri, {
        folder: 'cleangreen/waste-images',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
    });

    const uploadResults = await Promise.all(uploadPromises);
    
    const imageData = uploadResults.map(result => ({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    }));

    res.status(200).json({
      status: 'success',
      message: 'Images uploaded successfully',
      data: {
        images: imageData,
        count: imageData.length
      }
    });
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload images',
      details: error.message
    });
  }
});

router.delete('/:publicId', protect, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    await cloudinary.uploader.destroy(publicId);
    
    res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete image'
    });
  }
});

module.exports = router;
