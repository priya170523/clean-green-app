const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, restrictTo } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Pickup = require('../models/Pickup');
const User = require('../models/User');

// Get delivery earnings summary
router.get('/earnings', protect, restrictTo('delivery'), async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total earnings and stats from Pickups
    const totalResult = await Pickup.aggregate([
      { $match: { deliveryAgent: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$earnings' },
          totalWaste: { $sum: '$estimatedWeight' },
          completedPickups: { $sum: 1 }
        }
      }
    ]);
    const totalEarnings = totalResult[0]?.totalEarnings || 0;
    const totalWaste = totalResult[0]?.totalWaste || 0;
    const completedPickups = totalResult[0]?.completedPickups || 0;

    // Today's earnings
    const todayResult = await Pickup.aggregate([
      { $match: { deliveryAgent: userId, status: 'completed', updatedAt: { $gte: startOfDay } } },
      {
        $group: {
          _id: null,
          todayEarnings: { $sum: '$earnings' },
          todayWaste: { $sum: '$estimatedWeight' }
        }
      }
    ]);
    const todayEarnings = todayResult[0]?.todayEarnings || 0;
    const todayWaste = todayResult[0]?.todayWaste || 0;

    // Week's earnings
    const weekResult = await Pickup.aggregate([
      { $match: { deliveryAgent: userId, status: 'completed', updatedAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: null,
          weekEarnings: { $sum: '$earnings' },
          weekWaste: { $sum: '$estimatedWeight' }
        }
      }
    ]);
    const weekEarnings = weekResult[0]?.weekEarnings || 0;
    const weekWaste = weekResult[0]?.weekWaste || 0;

    // Month's earnings and pickups
    const monthResult = await Pickup.aggregate([
      { $match: { deliveryAgent: userId, status: 'completed', updatedAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          monthEarnings: { $sum: '$earnings' },
          monthPickups: { $sum: 1 }
        }
      }
    ]);
    const monthEarnings = monthResult[0]?.monthEarnings || 0;
    const monthPickups = monthResult[0]?.monthPickups || 0;

    // Get user for additional stats
    const user = await User.findById(userId).select('earnings totalWaste completedPickups');

    res.json({
      status: 'success',
      data: {
        totalEarnings,
        totalWaste,
        completedPickups: user.completedPickups || completedPickups,
        todayEarnings,
        todayWaste,
        weekEarnings,
        weekWaste,
        monthEarnings,
        monthPickups
      }
    });
  } catch (error) {
    console.error('Error fetching delivery earnings:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch earnings' });
  }
});

module.exports = router;
