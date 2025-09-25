const express = require('express');
const Pickup = require('../models/Pickup');
const Reward = require('../models/Reward');
const Transaction = require('../models/Transaction');
const Address = require('../models/Address');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth'); // Destructure the functions
const { upload } = require('../utils/fileUpload');

const router = express.Router();

// Admin: list pickups by status (default pending)
router.get('/admin/pending', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const statuses = Array.isArray(status) ? status : [status];
    const query = { status: { $in: statuses } };
    const pickups = await Pickup.find(query)
      .populate('user', 'name email phone')
      .populate('address')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Pickup.countDocuments(query);
    res.status(200).json({
      status: 'success',
      data: { pickups, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } }
    });
  } catch (error) {
    console.error('Admin list pickups error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch pickups' });
  }
});

// Admin: approve pickup
// Upload pickup photo
router.post('/:id/photo', protect, restrictTo('delivery'), upload.single('photo'), async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) {
      return res.status(404).json({ status: 'error', message: 'Pickup not found' });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No photo uploaded' });
    }

    // Update pickup with photo URL
    pickup.photos = pickup.photos || [];
    pickup.photos.push({
      url: `/uploads/pickups/${req.file.filename}`,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    });

    await pickup.save();

    res.status(200).json({
      status: 'success',
      data: {
        url: `/uploads/pickups/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to upload photo' });
  }
});

router.put('/:id/admin/approve', protect, restrictTo('admin'), async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id).populate('user address');
    if (!pickup) {
      return res.status(404).json({ status: 'error', message: 'Pickup not found' });
    }

    if (pickup.status !== 'pending') {
      return res.status(400).json({ status: 'error', message: 'Pickup already processed' });
    }

    pickup.status = 'awaiting_agent';
    pickup.adminApproval = {
      approvedBy: req.user._id,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      reason: null
    };
    pickup.timeline.push({ status: 'admin_approved', timestamp: new Date(), notes: 'Approved by admin' });
    await pickup.save();

    // Generate reward coupon
    const couponCode = `CLEAN${Math.round(pickup.estimatedWeight * 10)}${Date.now().toString().slice(-5)}`;
    const weight = pickup.estimatedWeight || 1;
    const pointsEarned = Math.max(10, Math.round(weight * (pickup.wasteType === 'bottles' ? 15 : pickup.wasteType === 'other' ? 12 : 10)));
    const reward = await Reward.create({
      user: pickup.user._id,
      pickup: pickup._id,
      type: 'pickup_completion',
      title: 'Admin-approved pickup',
      description: `Congrats! Coupon for your ${pickup.wasteType} waste pickup`,
      couponCode,
      partner: 'Clean&Green',
      discount: `${Math.min(70, 10 + Math.round(weight * 2))}% off`,
      minOrder: '₹0',
      issuedDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      pointsEarned,
      icon: '🎟️'
    });

    // Notify user and agents (immediate or scheduled)
    if (req.io) {
      // Notify the requesting user
      req.io.to(`user-${pickup.user._id}`).emit('pickup-admin-approved', { pickup: pickup.toObject(), reward: reward.toObject() });
      // For scheduled, queue a delayed broadcast near the scheduled time
      const payload = { pickup: pickup.toObject(), message: 'Admin approved pickup available' };
      const isScheduled = pickup.priority === 'scheduled' && pickup.scheduledDate;
      if (isScheduled) {
        const delayMs = Math.max(0, new Date(pickup.scheduledDate).getTime() - Date.now());
        setTimeout(() => {
          req.io.to('delivery-all').emit('new-pickup-available', payload);
          req.io.to('delivery-all').emit('new-pickup', payload);
        }, Math.min(delayMs, 24 * 60 * 60 * 1000));
      } else {
        req.io.to('delivery-all').emit('new-pickup-available', payload);
        req.io.to('delivery-all').emit('new-pickup', payload);
      }
    }

    res.status(200).json({ status: 'success', message: 'Pickup approved', data: { pickup, reward } });
  } catch (error) {
    console.error('Admin approve error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to approve pickup' });
  }
});

// Admin: reject pickup
router.put('/:id/admin/reject', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const pickup = await Pickup.findById(req.params.id).populate('user address');
    if (!pickup) {
      return res.status(404).json({ status: 'error', message: 'Pickup not found' });
    }
    if (pickup.status !== 'pending') {
      return res.status(400).json({ status: 'error', message: 'Pickup already processed' });
    }

    pickup.status = 'admin_rejected';
    pickup.adminApproval = {
      approvedBy: null,
      approvedAt: null,
      rejectedBy: req.user._id,
      rejectedAt: new Date(),
      reason: reason || 'Rejected by admin'
    };
    pickup.timeline.push({ status: 'admin_rejected', timestamp: new Date(), notes: reason || 'Rejected by admin' });
    await pickup.save();

    if (req.io) {
      req.io.to(`user-${pickup.user._id}`).emit('pickup-admin-rejected', { pickup: pickup.toObject() });
    }

    res.status(200).json({ status: 'success', message: 'Pickup rejected', data: pickup });
  } catch (error) {
    console.error('Admin reject error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to reject pickup' });
  }
});

// Create pickup request (only for current user)
router.post('/', protect, async (req, res) => {
  try {
    const {
      addressId,
      wasteType,
      wasteDetails,
      images,
      scheduledDate,
      scheduledTime,
      priority,
      estimatedWeight
    } = req.body;

    // Validation
    if (!addressId || !wasteType || !images || images.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Address, waste type, and at least one image are required'
      });
    }

    // Verify that the address belongs to the current user
    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found or does not belong to you'
      });
    }

    // Create pickup request
    const pickup = new Pickup({
      user: req.user._id,
      address: addressId,
      wasteType,
      wasteDetails,
      images,
      scheduledDate: priority === 'scheduled' ? scheduledDate : null,
      scheduledTime: priority === 'scheduled' ? scheduledTime : null,
      priority,
      estimatedWeight: estimatedWeight || 0,
      pickupLocation: {
        latitude: address.latitude,
        longitude: address.longitude
      }
    });

    // Calculate points and earnings
    pickup.calculatePoints();
    pickup.calculateEarnings();

    await pickup.save();

    // Populate address for response
    await pickup.populate('address user');

    // No agent visibility until admin approves

    res.status(201).json({
      status: 'success',
      message: 'Pickup request created successfully',
      data: pickup
    });
  } catch (error) {
    console.error('Error creating pickup:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create pickup request'
    });
  }
});

// (moved below to avoid conflicting with /user and other routes)

// Get user's pickups
router.get('/user', protect, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    
    let query = { user: req.user._id };
    if (status !== 'all') {
      query.status = status;
    }

    const pickups = await Pickup.find(query)
      .populate('address deliveryAgent')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Pickup.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        pickups,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: pickups.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user pickups:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pickups'
    });
  }
});

// Get single pickup (owner/admin/delivery)
router.get('/:id', protect, async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id).populate('address deliveryAgent user');
    if (!pickup) {
      return res.status(404).json({ status: 'error', message: 'Pickup not found' });
    }
    const isOwner = String(pickup.user._id) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    const isDelivery = req.user.role === 'delivery' && String(pickup.deliveryAgent) === String(req.user._id);
    if (!isOwner && !isAdmin && !isDelivery) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to view this pickup' });
    }
    res.status(200).json({ status: 'success', data: pickup });
  } catch (error) {
    console.error('Get pickup error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch pickup' });
  }
});

// Get available pickups (for delivery agents only) - only admin approved
router.get('/available', protect, restrictTo('delivery'), async (req, res) => {
  try {
    const pickups = await Pickup.find({ 
      status: { $in: ['admin_approved', 'awaiting_agent'] },
      deliveryAgent: null 
    })
      .populate('user address')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: pickups
    });
  } catch (error) {
    console.error('Error fetching available pickups:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch available pickups'
    });
  }
});

// Accept pickup request (for delivery agents)
router.put('/:id/accept', protect, restrictTo('delivery'), async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);
    
    if (!pickup) {
      return res.status(404).json({
        status: 'error',
        message: 'Pickup not found'
      });
    }

    if (!['admin_approved', 'awaiting_agent'].includes(pickup.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Pickup is not available for agents yet'
      });
    }

    // Update pickup
    pickup.deliveryAgent = req.user._id;
    pickup.status = 'accepted';
    pickup.timeline.push({
      status: 'accepted',
      timestamp: new Date(),
      notes: 'Pickup accepted by delivery agent'
    });

    await pickup.save();
    await pickup.populate('user address deliveryAgent');

    // Notify user via socket
    if (req.io) {
      req.io.to(`user-${pickup.user._id}`).emit('pickup-accepted', {
        pickup: pickup.toObject(),
        message: 'Your pickup has been accepted!'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Pickup accepted successfully',
      data: pickup
    });
  } catch (error) {
    console.error('Error accepting pickup:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to accept pickup'
    });
  }
});

// Delivery agent updates pickup status along the route
router.put('/:id/status', protect, restrictTo('delivery'), async (req, res) => {
  try {
    const { status, location, notes, distanceKm } = req.body;
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) {
      return res.status(404).json({ status: 'error', message: 'Pickup not found' });
    }
    if (String(pickup.deliveryAgent) !== String(req.user._id)) {
      return res.status(403).json({ status: 'error', message: 'Not your pickup' });
    }

    const allowed = ['accepted', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }

    pickup.status = status;
    if (typeof distanceKm === 'number') {
      pickup.distance = distanceKm;
    }
    pickup.timeline.push({ status, timestamp: new Date(), location, notes });

    // On completion, compute earnings and record transaction
    if (status === 'completed') {
      pickup.calculateEarnings();
      await Transaction.create({
        user: req.user._id,
        type: 'earning',
        amount: pickup.earnings,
        description: `Pickup ${pickup._id} completed`,
        status: 'completed',
        referenceId: `PK${pickup._id}`
      });
    }

    await pickup.save();
    await pickup.populate('user address deliveryAgent');

    res.status(200).json({ status: 'success', data: pickup });
  } catch (error) {
    console.error('Update pickup status error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update pickup status' });
  }
});

// Schedule after admin approves (user sets time/date)
router.put('/:id/schedule', protect, restrictTo('user'), async (req, res) => {
  try {
    const { scheduledDate, scheduledTime } = req.body;
    const pickup = await Pickup.findOne({ _id: req.params.id, user: req.user._id });
    if (!pickup) {
      return res.status(404).json({ status: 'error', message: 'Pickup not found' });
    }
    if (pickup.status !== 'awaiting_agent') {
      return res.status(400).json({ status: 'error', message: 'Pickup not ready for scheduling' });
    }
    pickup.priority = 'scheduled';
    pickup.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    pickup.scheduledTime = scheduledTime || null;
    await pickup.save();
    res.status(200).json({ status: 'success', message: 'Pickup scheduled', data: pickup });
  } catch (error) {
    console.error('Schedule after approval error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to schedule pickup' });
  }
});

// Other routes follow the same pattern...
// Update pickup status, rate pickup, etc.

module.exports = router;
