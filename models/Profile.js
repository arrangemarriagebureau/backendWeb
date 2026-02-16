const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    // ========== BASIC INFORMATION (Always Visible) ==========
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    gender: {
      type: String,
      enum: {
        values: ["Male", "Female", "Other"],
        message: "{VALUE} is not a valid gender",
      },
      required: [true, "Gender is required"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Must be at least 18 years old"],
      max: [100, "Age cannot exceed 100"],
    },
    dob: {
      type: Date,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    profession: {
      type: String,
      trim: true,
    },
    education: {
      type: String,
      trim: true,
    },
    height: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
    },
    imageUrl: {
      type: String,
    },
    cloudinaryId: {
      type: String,
    },

    // ========== PREMIUM/RESTRICTED DETAILS (Require Payment) ==========
    
    // Contact Information
    phoneNumber: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Personal Details
    income: {
      type: String,
      trim: true,
    },
    caste: {
      type: String,
      trim: true,
    },
    gotra: {
      type: String,
      trim: true,
    },
    maritalStatus: {
      type: String,
      enum: ["Never Married", "Divorced", "Widowed", "Separated", ""],
      default: "Never Married",
    },
    motherTongue: {
      type: String,
      trim: true,
    },
    religion: {
      type: String,
      trim: true,
    },
    
    // Physical Attributes
    bodyType: {
      type: String,
      enum: ["Slim", "Average", "Athletic", "Heavy", ""],
      trim: true,
    },
    complexion: {
      type: String,
      enum: ["Fair", "Wheatish", "Dark", "Very Fair", ""],
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      trim: true,
    },
    
    // Lifestyle
    diet: {
      type: String,
      enum: ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", ""],
      trim: true,
    },
    drinking: {
      type: String,
      enum: ["No", "Yes - Socially", "Yes - Regularly", ""],
      trim: true,
    },
    smoking: {
      type: String,
      enum: ["No", "Yes - Socially", "Yes - Regularly", ""],
      trim: true,
    },

    // Family Details
    familyType: {
      type: String,
      enum: ["Joint", "Nuclear", ""],
      trim: true,
    },
    fatherName: {
      type: String,
      trim: true,
    },
    fatherOccupation: {
      type: String,
      trim: true,
    },
    motherName: {
      type: String,
      trim: true,
    },
    motherOccupation: {
      type: String,
      trim: true,
    },
    siblings: {
      type: String,
      trim: true,
    },
    familyIncome: {
      type: String,
      trim: true,
    },
    familyLocation: {
      type: String,
      trim: true,
    },
    
    // Horoscope Details
    birthPlace: {
      type: String,
      trim: true,
    },
    birthTime: {
      type: String,
      trim: true,
    },
    rashi: {
      type: String,
      trim: true,
    },
    nakshatra: {
      type: String,
      trim: true,
    },
    manglik: {
      type: String,
      enum: ["Yes", "No", "Anshik", "Don't Know", ""],
      trim: true,
    },

    // Partner Preferences
    partnerAgeMin: {
      type: Number,
      min: 18,
      max: 100,
    },
    partnerAgeMax: {
      type: Number,
      min: 18,
      max: 100,
    },
    partnerHeightMin: {
      type: String,
      trim: true,
    },
    partnerHeightMax: {
      type: String,
      trim: true,
    },
    partnerMaritalStatus: {
      type: String,
      trim: true,
    },
    partnerEducation: {
      type: String,
      trim: true,
    },
    partnerProfession: {
      type: String,
      trim: true,
    },
    partnerLocation: {
      type: String,
      trim: true,
    },
    partnerIncome: {
      type: String,
      trim: true,
    },

    // ========== PROFILE SETTINGS ==========
    isPremium: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========== ENGAGEMENT METRICS ==========
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    accessRequestsCount: {
      type: Number,
      default: 0,
    },
    approvedAccessCount: {
      type: Number,
      default: 0,
    },

    // ========== PROFILE STATUS ==========
    profileStatus: {
      type: String,
      enum: ["Active", "Inactive", "Matched", "Deleted"],
      default: "Active",
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ========== INDEXES ==========
ProfileSchema.index({ createdBy: 1 });
ProfileSchema.index({ gender: 1 });
ProfileSchema.index({ location: 1 });
ProfileSchema.index({ age: 1 });
ProfileSchema.index({ isPremium: 1 });
ProfileSchema.index({ isVerified: 1 });
ProfileSchema.index({ isFeatured: 1 });
ProfileSchema.index({ createdByAdmin: 1 });
ProfileSchema.index({ profileStatus: 1 });

// Compound indexes for common queries
ProfileSchema.index({ gender: 1, location: 1 });
ProfileSchema.index({ gender: 1, age: 1 });
ProfileSchema.index({ gender: 1, location: 1, age: 1 });
ProfileSchema.index({ isVerified: 1, profileStatus: 1 });

// Text index for search
ProfileSchema.index({ name: "text", location: "text", profession: "text" });

// ========== VIRTUALS ==========

// Virtual for calculating age from DOB
ProfileSchema.virtual("calculatedAge").get(function () {
  if (this.dob) {
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }
  return this.age;
});

// Virtual for profile completion percentage
ProfileSchema.virtual("completionPercentage").get(function () {
  const totalFields = [
    "name",
    "gender",
    "age",
    "location",
    "profession",
    "education",
    "height",
    "bio",
    "imageUrl",
    "phoneNumber",
    "income",
    "caste",
    "maritalStatus",
    "religion",
    "familyType",
    "fatherOccupation",
    "motherOccupation",
  ];

  let filledFields = 0;
  totalFields.forEach((field) => {
    if (this[field] && this[field] !== "") {
      filledFields++;
    }
  });

  return Math.round((filledFields / totalFields.length) * 100);
});

// ========== METHODS ==========

// Method to increment views
ProfileSchema.methods.incrementViews = async function () {
  this.views += 1;
  this.lastActiveAt = new Date();
  await this.save();
};

// Method to add a like
ProfileSchema.methods.addLike = async function (userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    await this.save();
  }
};

// Method to remove a like
ProfileSchema.methods.removeLike = async function (userId) {
  this.likes = this.likes.filter((id) => id.toString() !== userId.toString());
  await this.save();
};

// Method to increment access request count
ProfileSchema.methods.incrementAccessRequests = async function () {
  this.accessRequestsCount += 1;
  await this.save();
};

// Method to increment approved access count
ProfileSchema.methods.incrementApprovedAccess = async function () {
  this.approvedAccessCount += 1;
  await this.save();
};

// Method to get basic profile data (for users without access)
ProfileSchema.methods.getBasicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    age: this.age,
    gender: this.gender,
    location: this.location,
    profession: this.profession,
    education: this.education,
    height: this.height,
    imageUrl: this.imageUrl,
    bio: this.bio,
    isPremium: this.isPremium,
    isVerified: this.isVerified,
    isFeatured: this.isFeatured,
    views: this.views,
    hasRestrictedAccess: true,
    completionPercentage: this.completionPercentage,
  };
};

// Method to get full profile data (for users with access)
ProfileSchema.methods.getFullProfile = function () {
  return this.toObject({ virtuals: true });
};

// ========== STATIC METHODS ==========

// Static method to get profiles by filter
ProfileSchema.statics.findByFilters = function (filters) {
  const query = {};

  if (filters.gender) query.gender = filters.gender;
  if (filters.location) query.location = new RegExp(filters.location, "i");
  if (filters.minAge || filters.maxAge) {
    query.age = {};
    if (filters.minAge) query.age.$gte = filters.minAge;
    if (filters.maxAge) query.age.$lte = filters.maxAge;
  }
  if (filters.isPremium !== undefined) query.isPremium = filters.isPremium;
  if (filters.isVerified !== undefined) query.isVerified = filters.isVerified;
  if (filters.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
  if (filters.profileStatus) query.profileStatus = filters.profileStatus;
  else query.profileStatus = { $ne: "Deleted" }; // Exclude deleted by default

  return this.find(query).sort({ createdAt: -1 });
};

// Static method to search profiles
ProfileSchema.statics.searchProfiles = function (searchTerm) {
  return this.find(
    {
      $text: { $search: searchTerm },
      profileStatus: { $ne: "Deleted" },
    },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });
};

// Static method to get featured profiles
ProfileSchema.statics.getFeaturedProfiles = function (limit = 10) {
  return this.find({
    isFeatured: true,
    isVerified: true,
    profileStatus: "Active",
  })
    .sort({ views: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get recently added profiles
ProfileSchema.statics.getRecentProfiles = function (limit = 20) {
  return this.find({
    isVerified: true,
    profileStatus: "Active",
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// ========== MIDDLEWARE ==========

// Pre-save middleware to update lastActiveAt
ProfileSchema.pre("save", function (next) {
  if (this.isModified()) {
    this.lastActiveAt = new Date();
  }
  next();
});

// Pre-save middleware to validate age range
ProfileSchema.pre("save", function (next) {
  if (this.partnerAgeMin && this.partnerAgeMax) {
    if (this.partnerAgeMin > this.partnerAgeMax) {
      next(new Error("Partner minimum age cannot be greater than maximum age"));
    }
  }
  next();
});

module.exports = mongoose.model("Profile", ProfileSchema);