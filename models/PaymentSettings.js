const mongoose = require('mongoose');

const PaymentSettingsSchema = new mongoose.Schema({
    upiId: {
        type: String,
        required: true,
        trim: true
    },
    qrCodeUrl: {
        type: String,
        required: true
    },
    qrCodeCloudinaryId: {
        type: String
    },
    accessFee: {
        type: Number,
        required: true,
        default: 500
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure only one active payment settings document
PaymentSettingsSchema.index(
    { isActive: 1 }, 
    { unique: true, partialFilterExpression: { isActive: true } }
);

module.exports = mongoose.model('PaymentSettings', PaymentSettingsSchema);