const express = require('express');
const router = express.Router();
const authorize = require('../middleware/auth');
const Inquiry = require('../models/Inquiry');
const Profile = require('../models/Profile');

// @route   POST /api/inquiries
// @desc    Submit an inquiry about a profile
router.post('/', authorize, async (req, res) => {
    console.log("\n=== CREATE INQUIRY ===");
    console.log("User ID:", req.user.id);
    console.log("Body:", req.body);

    try {
        const { profileId, profileName, userName, userEmail, userPhone, message } = req.body;

        // Validate required fields
        if (!profileId || !profileName || !userName || !userEmail || !userPhone || !message) {
            return res.status(400).json({
                success: false,
                msg: 'All fields are required'
            });
        }

        // Check if profile exists
        const profile = await Profile.findById(profileId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                msg: 'Profile not found'
            });
        }

        // Create inquiry
        const inquiry = new Inquiry({
            profileId,
            profileName,
            userId: req.user.id,
            userName,
            userEmail,
            userPhone,
            message,
            status: 'pending',
            isRead: false
        });

        await inquiry.save();

        console.log("✅ Inquiry created:", inquiry._id);

        res.status(201).json({
            success: true,
            msg: 'Inquiry submitted successfully',
            inquiry
        });

    } catch (error) {
        console.error("❌ Error creating inquiry:", error);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: error.message
        });
    }
});

// @route   GET /api/inquiries
// @desc    Get all inquiries (Admin only)
router.get('/', authorize, async (req, res) => {
    console.log("\n=== GET ALL INQUIRIES ===");
    console.log("User ID:", req.user.id);
    console.log("User Role:", req.user.role);

    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                msg: 'Access denied. Admin only.'
            });
        }

        const inquiries = await Inquiry.find()
            .populate('userId', 'fullName email')
            .populate('profileId', 'name imageUrl')
            .sort({ createdAt: -1 });

        console.log(`✅ Retrieved ${inquiries.length} inquiries`);

        res.json({
            success: true,
            count: inquiries.length,
            inquiries
        });

    } catch (error) {
        console.error("❌ Error fetching inquiries:", error);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: error.message
        });
    }
});

// @route   GET /api/inquiries/my
// @desc    Get current user's inquiries
router.get('/my', authorize, async (req, res) => {
    console.log("\n=== GET MY INQUIRIES ===");
    console.log("User ID:", req.user.id);

    try {
        const inquiries = await Inquiry.find({ userId: req.user.id })
            .populate('profileId', 'name imageUrl location profession')
            .sort({ createdAt: -1 });

        console.log(`✅ User has ${inquiries.length} inquiries`);

        res.json({
            success: true,
            count: inquiries.length,
            inquiries
        });

    } catch (error) {
        console.error("❌ Error fetching user inquiries:", error);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: error.message
        });
    }
});

// @route   GET /api/inquiries/:id
// @desc    Get inquiry by ID
router.get('/:id', authorize, async (req, res) => {
    console.log("\n=== GET INQUIRY BY ID ===");
    console.log("Inquiry ID:", req.params.id);

    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate('userId', 'fullName email phone')
            .populate('profileId', 'name imageUrl location profession age gender');

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                msg: 'Inquiry not found'
            });
        }

        // Check if user owns the inquiry or is admin
        if (inquiry.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                msg: 'Not authorized to view this inquiry'
            });
        }

        console.log("✅ Inquiry found");

        res.json({
            success: true,
            inquiry
        });

    } catch (error) {
        console.error("❌ Error fetching inquiry:", error);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: error.message
        });
    }
});

// @route   PUT /api/inquiries/:id
// @desc    Update inquiry status (Admin only)
router.put('/:id', authorize, async (req, res) => {
    console.log("\n=== UPDATE INQUIRY ===");
    console.log("Inquiry ID:", req.params.id);
    console.log("Update data:", req.body);

    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                msg: 'Access denied. Admin only.'
            });
        }

        const { status, adminNotes, isRead } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
        if (isRead !== undefined) updateData.isRead = isRead;

        const inquiry = await Inquiry.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('profileId', 'name');

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                msg: 'Inquiry not found'
            });
        }

        console.log("✅ Inquiry updated");

        res.json({
            success: true,
            msg: 'Inquiry updated successfully',
            inquiry
        });

    } catch (error) {
        console.error("❌ Error updating inquiry:", error);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: error.message
        });
    }
});

// @route   DELETE /api/inquiries/:id
// @desc    Delete inquiry (Admin only)
router.delete('/:id', authorize, async (req, res) => {
    console.log("\n=== DELETE INQUIRY ===");
    console.log("Inquiry ID:", req.params.id);

    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                msg: 'Access denied. Admin only.'
            });
        }

        const inquiry = await Inquiry.findByIdAndDelete(req.params.id);

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                msg: 'Inquiry not found'
            });
        }

        console.log("✅ Inquiry deleted");

        res.json({
            success: true,
            msg: 'Inquiry deleted successfully'
        });

    } catch (error) {
        console.error("❌ Error deleting inquiry:", error);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: error.message
        });
    }
});

// @route   GET /api/inquiries/stats/count
// @desc    Get inquiry statistics (Admin only)
router.get('/stats/count', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                msg: 'Access denied. Admin only.'
            });
        }

        const total = await Inquiry.countDocuments();
        const pending = await Inquiry.countDocuments({ status: 'pending' });
        const contacted = await Inquiry.countDocuments({ status: 'contacted' });
        const completed = await Inquiry.countDocuments({ status: 'completed' });
        const unread = await Inquiry.countDocuments({ isRead: false });

        res.json({
            success: true,
            stats: {
                total,
                pending,
                contacted,
                completed,
                unread
            }
        });

    } catch (error) {
        console.error("❌ Error fetching stats:", error);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: error.message
        });
    }
});

module.exports = router;