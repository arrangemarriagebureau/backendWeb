const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    profileName: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    userPhone: {
        type: String,
        required: true
    },
    amountPaid: {
        type: Number,
        required: true
    },
    utrNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 12
    },
    paymentMethod: {
        type: String,
        enum: ['UPI', 'QR Code'],
        required: true
    },
    paymentProof: {
        type: String // Cloudinary URL
    },
    paymentProofCloudinaryId: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedAt: {
        type: Date
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminNotes: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes
AccessRequestSchema.index({ profileId: 1, userId: 1 });
AccessRequestSchema.index({ status: 1 });
AccessRequestSchema.index({ utrNumber: 1 }, { unique: true });
AccessRequestSchema.index({ createdAt: -1 });

// Compound index for checking user access to specific profile
AccessRequestSchema.index({ userId: 1, profileId: 1, status: 1 });

module.exports = mongoose.model('AccessRequest', AccessRequestSchema);