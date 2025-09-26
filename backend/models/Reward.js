const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pickup',
    default: null
  },
  type: {
    type: String,
    enum: ['pickup_completion', 'milestone', 'special_achievement', 'referral', 'level_up'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  couponCode: {
    type: String,
    required: true,
    unique: true
  },
  partner: {
    type: String,
    required: true
  },
  discount: {
    type: String,
    required: true
  },
  minOrder: {
    type: String,
    default: null
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isRedeemed: {
    type: Boolean,
    default: false
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  pointsRequired: {
    type: Number,
    default: 0
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: '🎁'
  }
}, {
  timestamps: true
});

// Index for better query performance
rewardSchema.index({ user: 1, isRedeemed: 1 });
rewardSchema.index({ couponCode: 1 });
rewardSchema.index({ expiryDate: 1 });
rewardSchema.index({ issuedDate: -1 });

// Virtual to check if reward is expired
rewardSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual to check if reward is valid (not expired and not redeemed)
rewardSchema.virtual('isValid').get(function() {
  return !this.isExpired && !this.isRedeemed;
});

// Method to redeem reward
rewardSchema.methods.redeem = function() {
  if (this.isExpired) {
    throw new Error('Coupon has expired');
  }
  if (this.isRedeemed) {
    throw new Error('Coupon has already been redeemed');
  }
  
  this.isRedeemed = true;
  this.redeemedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Reward', rewardSchema);
