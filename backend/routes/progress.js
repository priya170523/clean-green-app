
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

        // Create first-time pickup coupon if this is the user's first transaction
        const totalTransactions = await Transaction.countDocuments({ user: user._id });
        if (totalTransactions === 1 && !user.firstPickupCouponUsed) {
            await Reward.create({
                user: user._id,
                type: 'first_pickup',
                title: 'First-Time Pickup Coupon',
                description: 'Congratulations on your first waste submission!',
                couponCode: `FIRST${user._id.slice(-6)}`,
                partner: 'Clean Green App',
                discount: '₹50 OFF',
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
            user.firstPickupCouponUsed = true;
            await user.save();
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

                    // Can spin only if user has submitted at least one waste transaction and hasn't spun this cycle
                    const hasSubmittedWaste = transactions.length > 0;
                    const canSpinWheel = hasSubmittedWaste && !(user.wheelSpunThisCycle || false);

                    res.json({
                        status: 'success',
                        data: {
                            totalWaste,
                            totalPoints: user.totalPoints || totalPoints,
                            currentLevel: user.currentLevel || 1,
                            cycleProgress: user.cycleProgress || 0,
                            wheelSpunThisCycle: user.wheelSpunThisCycle || false,
                            canSpin: canSpinWheel,
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
    const { value, type } = req.body;
    if (!value || !type) {
        return res.status(400).json({ status: 'error', message: 'Wheel result value and type required' });
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
            let title, description, discount;
            if (type === 'plant') {
                title = `Spin Win: Plant`;
                description = `You won: 1 Plant`;
                discount = `1 Plant`;
            } else if (type === 'seeds') {
                title = `Spin Win: Seeds`;
                description = `You won: ${value} Seeds`;
                discount = `${value} Seeds`;
            } else if (type === 'vermicompost') {
                title = `Spin Win: Vermicompost`;
                description = `You won: ${value} Vermicompost`;
                discount = `${value} Vermicompost`;
            } else if (type === 'cashback') {
                title = `Spin Win: ₹${value} Cashback`;
                description = `You won: ₹${value} Cashback`;
                discount = `₹${value} Cashback`;
            } else if (type === 'coupon') {
                title = `Spin Win: ₹${value} Coupon`;
                description = `You won: ₹${value} Coupon`;
                discount = `₹${value} OFF`;
            } else if (type === 'gift') {
                title = `Spin Win: Gift`;
                description = `You won: 1 Gift`;
                discount = `1 Gift`;
            } else {
                title = `Spin Win: ₹${value} OFF`;
                description = `You won: ₹${value} discount`;
                discount = `₹${value} OFF`;
            }

            return Reward.create({
                user: req.user.id,
                type: 'special_achievement',
                title,
                description,
                couponCode: `SPIN${Date.now().toString(36).slice(-6)}`,
                partner: 'Clean Green App',
                discount,
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
