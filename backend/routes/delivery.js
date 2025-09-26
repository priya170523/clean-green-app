const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Pickup = require('../models/Pickup');
const User = require('../models/User');

// Get delivery earnings summary
router.get('/earnings', protect, restrictTo('delivery'), async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total earnings and stats
    const totalTransactions = await Transaction.find({ 
      user: userId, 
      type: 'earning',
      status: 'completed'
    });
    const totalEarnings = totalTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalWaste = totalTransactions.reduce((sum, t) => sum + (t.wasteDetails?.quantity || 0), 0);
    const completedPickups = await Pickup.countDocuments({ 
      deliveryAgent: userId, 
      status: 'completed' 
    });

    // Today's earnings
    const todayTransactions = await Transaction.find({ 
      user: userId, 
      type: 'earning',
      status: 'completed',
      createdAt: { $gte: startOfDay }
    });
    const todayEarnings = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    const todayWaste = todayTransactions.reduce((sum, t) => sum + (t.wasteDetails?.quantity || 0), 0);

    // Week's earnings
    const weekTransactions = await Transaction.find({ 
      user: userId, 
      type: 'earning',
      status: 'completed',
      createdAt: { $gte: startOfWeek }
    });
    const weekEarnings = weekTransactions.reduce((sum, t) => sum + t.amount, 0);
    const weekWaste = weekTransactions.reduce((sum, t) => sum + (t.wasteDetails?.quantity || 0), 0);

    // Month's earnings and pickups
    const monthTransactions = await Transaction.find({ 
      user: userId, 
      type: 'earning',
      status: 'completed',
      createdAt: { $gte: startOfMonth }
    });
    const monthEarnings = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthPickups = await Pickup.countDocuments({ 
      deliveryAgent: userId, 
      status: 'completed',
      updatedAt: { $gte: startOfMonth }
    });

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
