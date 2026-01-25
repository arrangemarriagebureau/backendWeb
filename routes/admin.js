const express = require('express');
const router = express.Router();
const authorize = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { upload } = require('../config/cloudinary');

// @route   GET /api/admin/users
// @desc    Get all registered users (Admin Only)
router.get('/users', authorize, async (req, res) => {
    try {
        console.log("\n=== GET ALL USERS ===");
        console.log("Admin ID:", req.user.id);
        console.log("Admin Role:", req.user.role);

        // Check if user is admin
        if (req.user.role !== 'admin') {
            console.log("❌ Access denied - User is not admin");
            return res.status(403).json({ 
                success: false,
                msg: 'Access denied. Admin only.' 
            });
        }

        const users = await User.find().select('-password');
        console.log(`✅ Retrieved ${users.length} users`);
        
        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (err) {
        console.error("❌ Error fetching users:", err.message);
        res.status(500).json({ 
            success: false,
            msg: 'Server Error',
            error: err.message 
        });
    }
});

// @route   POST /api/admin/create-profile
// @desc    Admin creates a profile for the database
router.post('/create-profile', authorize, upload.single('image'), async (req, res) => {
    console.log("\n" + "=".repeat(60));
    console.log("🔵 BACKEND: Admin Profile Creation Request");
    console.log("=".repeat(60));

    try {
        console.log("1. Request received at:", new Date().toISOString());
        console.log("2. User from token:", req.user ? "✅ EXISTS" : "❌ MISSING");
        
        if (!req.user) {
            console.error("❌ No user in request - auth middleware failed");
            return res.status(401).json({ 
                success: false, 
                msg: 'Authentication required' 
            });
        }

        console.log("3. User details:");
        console.log("   - ID:", req.user.id);
        console.log("   - Role:", req.user.role);

        // Check admin role
        if (req.user.role !== 'admin') {
            console.error("❌ User is not admin. Role:", req.user.role);
            return res.status(403).json({ 
                success: false, 
                msg: 'Access denied. Admin only.' 
            });
        }

        console.log("4. ✅ User is admin - proceeding");

        console.log("5. Request body:", req.body);
        console.log("6. File uploaded:", req.file ? "✅ YES" : "⚠️  NO");
        if (req.file) {
            console.log("   - Filename:", req.file.filename);
            console.log("   - Path:", req.file.path);
            console.log("   - Size:", req.file.size, "bytes");
        }

        // Validate required fields
        const { name, age, gender, location } = req.body;
        
        console.log("7. Validating required fields:");
        console.log("   - name:", name ? "✅" : "❌");
        console.log("   - age:", age ? "✅" : "❌");
        console.log("   - gender:", gender ? "✅" : "❌");
        console.log("   - location:", location ? "✅" : "❌");

        if (!name || !age || !gender || !location) {
            console.error("❌ VALIDATION FAILED - Missing required fields");
            return res.status(400).json({
                success: false,
                msg: 'Missing required fields: name, age, gender, location',
                received: { name, age, gender, location }
            });
        }

        console.log("8. ✅ Validation passed");

        const profileData = {
            name: name,
            gender: gender,
            age: parseInt(age),
            location: location,
            profession: req.body.profession || '',
            education: req.body.education || '',
            height: req.body.height || '',
            income: req.body.income || '',
            bio: req.body.bio || '',
            createdBy: req.user.id,
            createdByAdmin: true,
            isVerified: true,
            isPremium: req.body.isPremium === 'true' || req.body.isPremium === true
        };

        if (req.body.dob) {
            profileData.dob = new Date(req.body.dob);
        }

        // Handle image upload
        if (req.file) {
            profileData.imageUrl = req.file.path;
            profileData.cloudinaryId = req.file.filename;
            console.log("9. ✅ Image data added to profile");
        }

        console.log("10. Profile data prepared:", {
            ...profileData,
            imageUrl: profileData.imageUrl ? 'SET' : 'NOT SET'
        });

        console.log("11. 💾 Saving to MongoDB...");
        const newProfile = new Profile(profileData);
        await newProfile.save();

        console.log("12. ✅✅✅ SUCCESS! Profile saved to database");
        console.log("    Profile ID:", newProfile._id);
        console.log("    Created at:", newProfile.createdAt);

        res.status(201).json({ 
            success: true, 
            msg: 'Profile created successfully',
            profile: newProfile 
        });

        console.log("13. ✅ Response sent to frontend");

    } catch (err) {
        console.error("❌❌❌ ERROR during profile creation:");
        console.error("    Name:", err.name);
        console.error("    Message:", err.message);
        console.error("    Stack:", err.stack);

        res.status(500).json({ 
            success: false, 
            msg: 'Server Error', 
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }

    console.log("=".repeat(60));
    console.log("🏁 BACKEND: Request processing complete");
    console.log("=".repeat(60) + "\n");
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (Admin Only)
router.delete('/users/:id', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                msg: 'Access denied. Admin only.' 
            });
        }

        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                msg: 'User not found' 
            });
        }

        await User.findByIdAndDelete(req.params.id);
        
        console.log(`✅ User deleted: ${user.email}`);
        res.json({ 
            success: true,
            msg: 'User deleted successfully' 
        });
    } catch (err) {
        console.error("❌ Error deleting user:", err.message);
        res.status(500).json({ 
            success: false,
            msg: 'Server Error',
            error: err.message 
        });
    }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics (Admin Only)
router.get('/stats', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                msg: 'Access denied. Admin only.' 
            });
        }

        const totalUsers = await User.countDocuments();
        const totalProfiles = await Profile.countDocuments();
        const premiumProfiles = await Profile.countDocuments({ isPremium: true });
        const verifiedProfiles = await Profile.countDocuments({ isVerified: true });
        const adminCreatedProfiles = await Profile.countDocuments({ createdByAdmin: true });

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalProfiles,
                premiumProfiles,
                verifiedProfiles,
                adminCreatedProfiles
            }
        });
    } catch (err) {
        console.error("❌ Error fetching stats:", err.message);
        res.status(500).json({ 
            success: false,
            msg: 'Server Error',
            error: err.message 
        });
    }
});

module.exports = router;