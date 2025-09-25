const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Reward = require('../models/Reward');

const { calculatePoints } = require('../utils/pointsCalculator');

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
            if (transactions.length === 1) {
                // Create first-time coupon if this is their first transaction
                firstTimeCoupon = {
                    code: `FIRST${req.user.id.slice(-6)}`,
                    value: 50 // ₹50 off
                };
            }

            // Check if user has already spun the wheel for 2kg milestone
            return User.findById(req.user.id)
                .then(user => {
                    const wheelSpun = user.achievements?.includes('2kg_wheel_spun') || false;

                    res.json({
                        status: 'success',
                        data: {
                            totalWaste,
                            totalPoints,
                            wheelSpun,
                            firstTimeCoupon,
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
            const totalWaste = transactions.reduce((sum, t) => sum + (t.weight || 0), 0);
            
            if (totalWaste < 2) {
                throw new Error('Must collect 2kg waste first');
            }
            
            if (userData.achievements?.includes('2kg_wheel_spun')) {
                throw new Error('Already claimed 2kg milestone reward');
            }

            // Create reward based on wheel result
            return Reward.create({
                user: req.user.id,
                title: 'Waste Warrior Reward',
                description: `Congratulations on collecting 2kg waste! You won: ${result}`,
                couponCode: `WW${Date.now().toString(36).slice(-6)}`,
                value: result,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
        })
        .then(reward => {
            // Mark milestone as achieved
            userData.achievements = [...(userData.achievements || []), '2kg_wheel_spun'];
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