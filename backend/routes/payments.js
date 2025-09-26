const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/initiate
// @desc    Initiate virtual payment
// @access  Private
router.post('/initiate', protect, async (req, res) => {
  try {
    const { amount, type } = req.body;

    // Virtual payment - always success
    res.status(200).json({
      status: 'success',
      message: 'Payment initiated successfully (virtual)',
      data: {
        paymentId: 'virtual_' + Date.now(),
        amount: amount,
        type: type,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during payment initiation'
    });
  }
});

module.exports = router;
