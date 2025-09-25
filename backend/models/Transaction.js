const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earning', 'withdrawal', 'bonus', 'penalty'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  pickup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pickup',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'bank_transfer', 'upi', 'cash'],
    default: 'wallet'
  },
  paymentDetails: {
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    bankName: String
  },
  referenceId: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  points: {
    type: Number,
    default: 0
  },
  wasteDetails: {
    type: {
      type: String,
      enum: ['plastic', 'paper', 'organic', 'metal', 'glass', 'mixed'],
      default: 'mixed'
    },
    quantity: {
      type: Number,
      required: true
    },
    pointsMultiplier: {
      type: Number,
      default: 1
    }
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ referenceId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
