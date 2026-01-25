const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    gender: { 
        type: String, 
        enum: {
            values: ['Male', 'Female', 'Other'],
            message: '{VALUE} is not a valid gender'
        },
        required: [true, 'Gender is required']
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [18, 'Must be at least 18 years old'],
        max: [100, 'Age cannot exceed 100']
    },
    dob: {
        type: Date
    },
    location: { 
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    profession: {
        type: String,
        trim: true
    },
    education: {
        type: String,
        trim: true
    },
    height: {
        type: String,
        trim: true
    },
    income: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        maxlength: [1000, 'Bio cannot exceed 1000 characters']
    },
    imageUrl: {
        type: String
    },
    cloudinaryId: {
        type: String
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdByAdmin: {
        type: Boolean,
        default: false
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { 
    timestamps: true 
});

// Indexes for better query performance
ProfileSchema.index({ createdBy: 1 });
ProfileSchema.index({ gender: 1 });
ProfileSchema.index({ location: 1 });
ProfileSchema.index({ age: 1 });
ProfileSchema.index({ isPremium: 1 });
ProfileSchema.index({ isVerified: 1 });
ProfileSchema.index({ createdByAdmin: 1 });

// Compound indexes for common queries
ProfileSchema.index({ gender: 1, location: 1 });
ProfileSchema.index({ gender: 1, age: 1 });

// Virtual for calculating age from DOB if needed
ProfileSchema.virtual('calculatedAge').get(function() {
    if (this.dob) {
        const today = new Date();
        const birthDate = new Date(this.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    return this.age;
});

// Method to increment views
ProfileSchema.methods.incrementViews = async function() {
    this.views += 1;
    await this.save();
};

// Method to add a like
ProfileSchema.methods.addLike = async function(userId) {
    if (!this.likes.includes(userId)) {
        this.likes.push(userId);
        await this.save();
    }
};

// Method to remove a like
ProfileSchema.methods.removeLike = async function(userId) {
    this.likes = this.likes.filter(id => id.toString() !== userId.toString());
    await this.save();
};

// Static method to get profiles by filter
ProfileSchema.statics.findByFilters = function(filters) {
    const query = {};
    
    if (filters.gender) query.gender = filters.gender;
    if (filters.location) query.location = new RegExp(filters.location, 'i');
    if (filters.minAge) query.age = { $gte: filters.minAge };
    if (filters.maxAge) query.age = { ...query.age, $lte: filters.maxAge };
    if (filters.isPremium !== undefined) query.isPremium = filters.isPremium;
    
    return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Profile', ProfileSchema);