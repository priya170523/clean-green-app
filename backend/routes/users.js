const express = require('express');
const User = require('../models/User');
const Pickup = require('../models/Pickup');
const Address = require('../models/Address');
const Reward = require('../models/Reward');
const { protect, restrictTo } = require('../middleware/auth'); // Destructure the functions
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const router = express.Router();

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('addresses defaultAddress')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('addresses defaultAddress').select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update profile'
    });
  }
});

// Get total waste stats for all users (for dashboard graph)
router.get('/total-waste-stats', protect, async (req, res) => {
  try {
    // Get last 7 days labels
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      week.push({
        label: days[d.getDay()],
        date: d.toISOString().slice(0, 10),
      });
    }

    // Count pickups per day for all users
    const counts = await Promise.all(week.map(async (day) => {
      const count = await Pickup.countDocuments({
        createdAt: {
          $gte: new Date(day.date + 'T00:00:00.000Z'),
          $lt: new Date(day.date + 'T23:59:59.999Z')
        }
      });
      return { label: day.label, value: count };
    }));

    res.status(200).json({
      status: 'success',
      data: counts
    });
  } catch (error) {
    console.error('Error fetching total waste stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch total waste stats'
    });
  }
});

// Get user dashboard data (user-specific)
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's pickup stats
    const totalPickups = await Pickup.countDocuments({ user: userId });
    const completedPickups = await Pickup.countDocuments({ 
      user: userId, 
      status: 'completed' 
    });
    const pendingPickups = await Pickup.countDocuments({ 
      user: userId, 
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });

    // Get user's total points
    const user = await User.findById(userId);
    const totalPoints = user.totalPoints || 0;
    const currentLevel = user.getLevel(totalPoints);

    // Get recent uploads (user's pickups)
    const recentPickups = await Pickup.find({ user: userId })
      .populate('address')
      .sort({ createdAt: -1 })
      .limit(5);

    // Separate recent uploads by status
    const recentUploads = {
      accepted: recentPickups.find(p => p.status === 'completed'),
      rejected: recentPickups.find(p => p.status === 'cancelled'),
      pending: recentPickups.filter(p => ['pending', 'accepted', 'in_progress'].includes(p.status))
    };

    // Get user's rewards (if Reward model exists)
    let rewards = [];
    try {
      rewards = await Reward.find({ user: userId, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(3);
    } catch (rewardError) {
      console.log('Reward model not found, using empty array');
      rewards = [];
    }

    // Calculate environmental impact (based on completed pickups)
    const completedPickupsData = await Pickup.find({ 
      user: userId, 
      status: 'completed' 
    });
    
    const totalWeight = completedPickupsData.reduce((sum, pickup) => 
      sum + (pickup.actualWeight || pickup.estimatedWeight || 0), 0
    );

    const environmentalImpact = {
      wasteCollected: totalWeight,
      co2Saved: Math.round(totalWeight * 2.5), // Rough estimate
      treesEquivalent: Math.round(totalWeight * 0.1),
      landfillDiverted: totalWeight
    };

    // Get monthly stats for chart
    const monthlyStats = await getMonthlyStats(userId);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalPickups,
          completedPickups,
          pendingPickups,
          totalPoints,
          totalSubmissions: completedPickups,
          totalWaste: totalWeight,
          currentLevel
        },
        recentUploads,
        rewards,
        environmentalImpact,
        monthlyStats,
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Helper function to get monthly stats
async function getMonthlyStats(userId) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Pickup.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          points: { $sum: '$points' },
          weight: { $sum: { $ifNull: ['$actualWeight', '$estimatedWeight'] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Fill in missing months with zero data
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const existingData = monthlyData.find(d => 
        d._id.year === year && d._id.month === month
      );
      
      months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        pickups: existingData ? existingData.count : 0,
        points: existingData ? existingData.points : 0,
        weight: existingData ? existingData.weight : 0
      });
    }

    return months;
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    return [];
  }
}

// Get user history (pickups)
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const history = await Pickup.find({ user: req.user._id })
      .populate('address deliveryAgent')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Pickup.countDocuments({ user: req.user._id });

    res.status(200).json({
      status: 'success',
      data: {
        history,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: history.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch history'
    });
  }
});

// Update online status (for delivery agents)
router.put('/online-status', protect, restrictTo('delivery'), async (req, res) => {
  try {
    const { isOnline } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline: !!isOnline },
      { new: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      message: 'Online status updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Error updating online status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update online status'
    });
  }
});

// Get earnings (for delivery agents)
router.get('/earnings', protect, restrictTo('delivery'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get completed pickups for this delivery agent
    const completedPickups = await Pickup.find({
      deliveryAgent: req.user._id,
      status: 'completed'
    }).populate('user address');

    // Calculate earnings breakdown
    const earningsBreakdown = completedPickups.map(pickup => ({
      pickupId: pickup._id,
      date: pickup.completedAt || pickup.updatedAt,
      customerName: pickup.user.name,
      address: pickup.address.fullAddress,
      amount: pickup.earnings || 0,
      distance: pickup.distance || 0
    }));

    res.status(200).json({
      status: 'success',
      data: {
        totalEarnings: user.earnings.total,
        availableEarnings: user.earnings.available,
        withdrawnEarnings: user.earnings.withdrawn,
        completedPickups: user.completedPickups,
        earningsBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch earnings'
    });
  }
});

module.exports = router;
