
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Reward = require('../models/Reward');

const { calculatePoints } = require('../utils/pointsCalculator');

// Update user progress after delivery (for spin)
router.post('/update', protect, async function(req, res) {
    try {
        const body = req.body.post || req.body;
        const { pickupId, weight } = body;
        if (!pickupId || !weight) {
            return res.status(400).json({ status: 'error', message: 'pickupId and weight required' });
        }

        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Add to cycle progress
        user.cycleProgress = (user.cycleProgress || 0) + Number(weight);

        // Calculate points based on waste type and weight
        const { points } = calculatePoints('mixed', Number(weight)); // Default to mixed type

        // Create transaction record
        const transaction = new Transaction({
            user: user._id,
            type: 'points',
            amount: 0,
            description: `Earned ${points} points for ${weight}kg waste`,
            pickup: pickupId,
            status: 'completed',
            points: points,
            wasteDetails: {
                type: 'mixed',
                quantity: Number(weight)
            }
        });

        // Update user's total points
        user.totalPoints = (user.totalPoints || 0) + points;

        // Check for level up
        const oldLevel = user.currentLevel || 1;
        const newLevel = user.getLevel(user.totalPoints);
        user.currentLevel = newLevel;

        // Save both user and transaction
        await Promise.all([
            user.save(),
            transaction.save()
        ]);

        // Create level up coupon if leveled up
        if (newLevel > oldLevel) {
            await Reward.create({
                user: user._id,
                type: 'level_up',
                title: `Level ${newLevel} Achievement`,
                description: `Congratulations! You've reached Level ${newLevel}!`,
                couponCode: `LEVEL${newLevel}${Date.now().toString(36).slice(-4)}`,
                partner: 'Clean Green App',
                discount: `₹${newLevel * 10} OFF`,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
        }

        // Enable spin for every submission
        user.wheelSpunThisCycle = false;
        await user.save();

        // Calculate totalWaste from transactions
        const transactions = await Transaction.find({ user: user._id });
        let totalWaste = 0;
        transactions.forEach(t => {
            if (t.wasteDetails) totalWaste += t.wasteDetails.quantity || 0;
        });

        res.json({
            status: 'success',
            message: 'Progress updated',
            data: {
                totalWaste,
                totalPoints: user.totalPoints,
                earnedPoints: points,
                canSpin: true
            }
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// Get user's progress including total waste collected and rewards eligibility
router.get('/', protect, function(req, res) {
    Transaction.find({ user: req.user.id })
        .then(transactions => {
            let totalWaste = 0;
            let totalPoints = 0;

            // Calculate total waste and points
            transactions.forEach(transaction => {
                if (transaction.wasteDetails) {
                    totalWaste += transaction.wasteDetails.quantity || 0;
                    totalPoints += transaction.points || calculatePoints(
                        transaction.wasteDetails.type,
                        transaction.wasteDetails.quantity
                    );
                }
            });

            // Check first-time pickup coupon eligibility
            let firstTimeCoupon = null;

            // Check if user has already spun the wheel for 2kg milestone
            return User.findById(req.user.id)
                .then(user => {
                    if (!user.firstPickupCouponUsed && transactions.length > 0) {
                        // Create first-time coupon if not used and has transactions
                        firstTimeCoupon = {
                            code: `FIRST${req.user.id.slice(-6)}`,
                            value: 50 // ₹50 off
                        };
                    }

                    res.json({
                        status: 'success',
                        data: {
                            totalWaste,
                            totalPoints: user.totalPoints || totalPoints,
                            currentLevel: user.currentLevel || 1,
                            cycleProgress: user.cycleProgress || 0,
                            wheelSpunThisCycle: user.wheelSpunThisCycle || false,
                            canSpin: !(user.wheelSpunThisCycle || false),
                            firstTimeCoupon: (!user.firstPickupCouponUsed && transactions.length === 1) ? {
                                code: `FIRST${req.user.id.slice(-6)}`,
                                value: 50 // ₹50 off
                            } : null,
                            wasteTypes: transactions.reduce((acc, t) => {
                                if (t.wasteDetails?.type) {
                                    acc[t.wasteDetails.type] = (acc[t.wasteDetails.type] || 0) + t.wasteDetails.quantity;
                                }
                                return acc;
                            }, {})
                        }
                    });
                });
        })
        .catch(error => {
            console.error('Error fetching progress:', error);
            res.status(500).json({ status: 'error', message: 'Server error' });
        });
});

// Handle wheel spin reward claim
router.post('/wheel-reward', protect, function(req, res) {
    const { result } = req.body;
    if (!result) {
        return res.status(400).json({ status: 'error', message: 'Wheel result required' });
    }

    let userData;
    
    User.findById(req.user.id)
        .then(user => {
            userData = user;
            return Transaction.find({ user: req.user.id });
        })
        .then(transactions => {
            if (userData.wheelSpunThisCycle) {
                throw new Error('Not eligible for spin');
            }

            // Create reward based on wheel result
            return Reward.create({
                user: req.user.id,
                type: 'special_achievement',
                title: 'Spin Reward',
                description: `You won: ${result}`,
                couponCode: `SPIN${Date.now().toString(36).slice(-6)}`,
                partner: 'Clean Green App',
                discount: `₹${result} OFF`,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
        })
        .then(reward => {
            // Reset cycle and mark spun
            userData.cycleProgress = 0;
            userData.wheelSpunThisCycle = true;
            return userData.save().then(() => reward);
        })
        .then(reward => {
            res.json({
                status: 'success',
                data: reward
            });
        })
        .catch(error => {
            console.error('Error handling wheel reward:', error);
            const statusCode = error.message.includes('Must collect') || error.message.includes('Already claimed') ? 400 : 500;
            res.status(statusCode).json({ 
                status: 'error', 
                message: statusCode === 400 ? error.message : 'Server error' 
            });
        });
});

module.exports = router;
