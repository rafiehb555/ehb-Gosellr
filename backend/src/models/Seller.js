const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  // Seller Type & Profile
  sellerType: {
    type: String,
    enum: ['shopkeeper', 'store', 'wholesaler', 'distributor', 'dealer', 'company'],
    required: true
  },
  profileType: {
    type: String,
    enum: ['product_seller', 'service_provider', 'both'],
    default: 'product_seller'
  },
  shopName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  // SQL Levels (Separate for Products & Services)
  productSQL_level: {
    type: String,
    enum: ['Free', 'Basic', 'Normal', 'High', 'VIP'],
    default: 'Free'
  },
  serviceSQL_level: {
    type: String,
    enum: ['Free', 'Basic', 'Normal', 'High', 'VIP'],
    default: 'Free'
  },
  // Verification Status
  verified: {
    type: Boolean,
    default: false
  },
  // KYC Documents
  kyc_docs: {
    cnic: {
      number: String,
      frontImage: String,
      backImage: String,
      verified: { type: Boolean, default: false }
    },
    businessLicense: {
      number: String,
      image: String,
      verified: { type: Boolean, default: false }
    },
    addressProof: {
      type: String,
      image: String,
      verified: { type: Boolean, default: false }
    },
    bankStatement: {
      image: String,
      verified: { type: Boolean, default: false }
    }
  },
  // Business Details
  businessDetails: {
    businessName: String,
    businessType: { type: String, enum: ['individual', 'partnership', 'company'] },
    registrationNumber: String,
    taxNumber: String,
    establishedYear: Number,
    employeeCount: Number,
    annualRevenue: Number
  },
  // Service Provider Specific
  serviceCategories: [{
    type: String,
    enum: [
      'Electrician', 'Plumber', 'AC Technician', 'Carpenter', 'Painter',
      'Tutor', 'Driver', 'Chef', 'Photographer', 'Beautician',
      'Tailor', 'Mechanic', 'Gardener', 'Security Guard', 'Housekeeper',
      'Interior Designer', 'Architect', 'Lawyer', 'Doctor', 'Consultant',
      'IT Services', 'Marketing', 'Design', 'Writing', 'Translation',
      'Event Planning', 'Wedding Services', 'Cleaning', 'Moving', 'Other'
    ]
  }],
  serviceAreas: [{
    type: String,
    trim: true
  }],
  // PSS, EDR, EMO Verification (Separate for Products & Services)
  productVerification: {
    pss: { status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, verifiedAt: Date, verifiedBy: String },
    edr: { status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, verifiedAt: Date, verifiedBy: String },
    emo: { status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, verifiedAt: Date, verifiedBy: String }
  },
  serviceVerification: {
    pss: { status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, verifiedAt: Date, verifiedBy: String },
    edr: { status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, verifiedAt: Date, verifiedBy: String },
    emo: { status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, verifiedAt: Date, verifiedBy: String }
  },
  // Contact Information
  contactInfo: {
    phone: String,
    whatsapp: String,
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      linkedin: String
    }
  },
  // Location Details
  address: {
    street: String,
    city: String,
    area: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Account Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'locked', 'pending'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Login Security
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  // Analytics
  totalProducts: {
    type: Number,
    default: 0
  },
  totalServices: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
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
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
sellerSchema.index({ email: 1 }, { unique: true });
sellerSchema.index({ contact: 1 });
sellerSchema.index({ sellerType: 1 });
sellerSchema.index({ profileType: 1 });
sellerSchema.index({ productSQL_level: 1 });
sellerSchema.index({ serviceSQL_level: 1 });
sellerSchema.index({ verified: 1 });
sellerSchema.index({ status: 1 });
sellerSchema.index({ isActive: 1 });
sellerSchema.index({ 'address.city': 1 });
sellerSchema.index({ 'address.area': 1 });
sellerSchema.index({ serviceCategories: 1 });

// Pre-save middleware
sellerSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  this.updatedAt = new Date();
  next();
});

// Instance methods
sellerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

sellerSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

sellerSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

sellerSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

sellerSchema.methods.isProductSeller = function() {
  return this.profileType === 'product_seller' || this.profileType === 'both';
};

sellerSchema.methods.isServiceProvider = function() {
  return this.profileType === 'service_provider' || this.profileType === 'both';
};

sellerSchema.methods.getSQLLevel = function(type = 'product') {
  return type === 'service' ? this.serviceSQL_level : this.productSQL_level;
};

sellerSchema.methods.isFullyVerified = function(type = 'product') {
  const verification = type === 'service' ? this.serviceVerification : this.productVerification;
  return verification.pss.status === 'approved' &&
         verification.edr.status === 'approved' &&
         verification.emo.status === 'approved';
};

sellerSchema.methods.updateProductCount = function(count) {
  this.totalProducts = count;
  return this.save();
};

sellerSchema.methods.updateServiceCount = function(count) {
  this.totalServices = count;
  return this.save();
};

sellerSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Static methods
sellerSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

sellerSchema.statics.findBySQLLevel = function(sqlLevel, type = 'product') {
  const field = type === 'service' ? 'serviceSQL_level' : 'productSQL_level';
  return this.find({ [field]: sqlLevel, isActive: true });
};

sellerSchema.statics.findServiceProviders = function() {
  return this.find({
    profileType: { $in: ['service_provider', 'both'] },
    isActive: true
  });
};

sellerSchema.statics.findProductSellers = function() {
  return this.find({
    profileType: { $in: ['product_seller', 'both'] },
    isActive: true
  });
};

sellerSchema.statics.findByServiceCategory = function(category) {
  return this.find({
    serviceCategories: category,
    profileType: { $in: ['service_provider', 'both'] },
    isActive: true
  });
};

sellerSchema.statics.findByLocation = function(city) {
  return this.find({
    'address.city': { $regex: city, $options: 'i' },
    isActive: true
  });
};

sellerSchema.statics.getSellerStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalSellers: { $sum: 1 },
        productSellers: {
          $sum: {
            $cond: [
              { $in: ['$profileType', ['product_seller', 'both']] },
              1,
              0
            ]
          }
        },
        serviceProviders: {
          $sum: {
            $cond: [
              { $in: ['$profileType', ['service_provider', 'both']] },
              1,
              0
            ]
          }
        },
        verifiedSellers: {
          $sum: {
            $cond: ['$verified', 1, 0]
          }
        },
        averageRating: { $avg: '$rating.average' }
      }
    }
  ]);
};

module.exports = mongoose.model('Seller', sellerSchema);
