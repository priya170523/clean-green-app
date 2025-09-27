const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'delivery', 'admin'],
    default: 'user'
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  achievements: {
    type: [String],
    default: []
  },
  // User specific fields
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  }],
  defaultAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  currentLevel: {
    type: Number,
    default: 1
  },
  totalPickups: {
    type: Number,
    default: 0
  },
  spinAvailable: {
    type: Boolean,
    default: false
  },
  firstPickupCouponUsed: {
    type: Boolean,
    default: false
  },
  // Delivery specific fields
  vehicleType: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (this.role === 'delivery') {
          return v && ['bike', 'scooter', 'car', 'van'].includes(v);
        }
        return true; // Allow null for non-delivery users
      },
      message: 'Vehicle type must be one of: bike, scooter, car, van for delivery agents'
    }
  },
  licenseNumber: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (this.role === 'delivery') {
          return v && v.trim().length > 0;
        }
        return true; // Allow null for non-delivery users
      },
      message: 'License number is required for delivery agents'
    }
  },
  vehicleImages: [{
    type: String
  }],
  documents: {
    aadhar: {
      url: String,
      publicId: String,
      verified: {
        type: Boolean,
        default: false
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    license: {
      url: String,
      publicId: String,
      verified: {
        type: Boolean,
        default: false
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    insurance: {
      url: String,
      publicId: String,
      verified: {
        type: Boolean,
        default: false
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    registration: {
      url: String,
      publicId: String,
      verified: {
        type: Boolean,
        default: false
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    other: {
      url: String,
      publicId: String,
      verified: {
        type: Boolean,
        default: false
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    available: {
      type: Number,
      default: 0
    },
    withdrawn: {
      type: Number,
      default: 0
    }
  },
  completedPickups: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Get level based on total points
userSchema.methods.getLevel = function(totalPoints = this.totalPoints) {
  if (totalPoints <= 200) return 1;
  if (totalPoints <= 400) return 2;
  if (totalPoints <= 800) return 3;
  if (totalPoints <= 1600) return 4;
  if (totalPoints <= 3200) return 5;
  if (totalPoints <= 6400) return 6;
  if (totalPoints <= 12800) return 7;
  if (totalPoints <= 25600) return 8;
  if (totalPoints <= 51200) return 9;
  return 10; // Max level
};

module.exports = mongoose.model('User', userSchema);
