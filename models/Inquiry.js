const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
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
        ref: 'User'
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
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'completed', 'rejected'],
        default: 'pending'
    },
    adminNotes: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
InquirySchema.index({ profileId: 1 });
InquirySchema.index({ userId: 1 });
InquirySchema.index({ status: 1 });
InquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inquiry', InquirySchema);