const express = require('express');
const router = express.Router();
const authorize = require('../middleware/auth');
const PaymentSettings = require('../models/PaymentSettings');
const { upload } = require('../config/cloudinary');

// @route   GET /api/payment-settings
// @desc    Get current payment settings (Public - for users to see payment details)
router.get('/', async (req, res) => {
    console.log("\n=== GET PAYMENT SETTINGS ===");

    try {
        let settings = await PaymentSettings.findOne({ isActive: true });

        if (!settings) {
            // Create default settings if none exist
            settings = new PaymentSettings({
                upiId: 'example@upi',
                qrCodeUrl: 'https://via.placeholder.com/300x300?text=QR+Code',
                accessFee: 500,
                isActive: true
            });
            await settings.save();
        }

        console.log("✅ Payment settings retrieved");

        res.json({
            success: true,
            settings: {
                upiId: settings.upiId,
                qrCodeUrl: settings.qrCodeUrl,
                accessFee: settings.accessFee
            }
        });

    } catch (error) {
        console.error("❌ Error fetching payment settings:", error);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: error.message
        });
    }
});

// @route   PUT /api/payment-settings
// @desc    Update payment settings (Admin only)
router.put('/', authorize, upload.single('qrCode'), async (req, res) => {
    console.log("\n=== UPDATE PAYMENT SETTINGS ===");

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                msg: 'Access denied. Admin only.'
            });
        }

        const { upiId, accessFee } = req.body;

        let settings = await PaymentSettings.findOne({ isActive: true });

        if (!settings) {
            settings = new PaymentSettings({
                upiId: upiId || 'example@upi',
                qrCodeUrl: req.file ? req.file.path : 'https://via.placeholder.com/300x300?text=QR+Code',
                qrCodeCloudinaryId: req.file ? req.file.filename : null,
                accessFee: accessFee || 500,
                isActive: true,
                lastUpdatedBy: req.user.id
            });
        } else {
            if (upiId) settings.upiId = upiId;
            if (accessFee) settings.accessFee = parseFloat(accessFee);
            if (req.file) {
                settings.qrCodeUrl = req.file.path;
                settings.qrCodeCloudinaryId = req.file.filename;
            }
            settings.lastUpdatedBy = req.user.id;
        }

        await settings.save();

        console.log("✅ Payment settings updated");

        res.json({
            success: true,
            msg: 'Payment settings updated successfully',
            settings
        });

    } catch (error) {
        console.error("❌ Error updating payment settings:", error);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: error.message
        });
    }
});

module.exports = router;