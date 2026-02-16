const express = require("express");
const router = express.Router();
const authorize = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const Profile = require("../models/Profile");

// @route   GET /api/profiles/me
// @desc    Get current user's profile

const AccessRequest = require("../models/AccessRequest");

// Helper function to check if user has access to premium details
async function hasAccessToPremiumDetails(userId, profileId) {
  const accessRequest = await AccessRequest.findOne({
    userId: userId,
    profileId: profileId,
    status: "approved",
  });
  return !!accessRequest;
}

// Helper function to filter profile data based on access
function filterProfileData(profile, hasAccess) {
  const profileObj = profile.toObject();

  if (hasAccess) {
    return profileObj; // Return all details
  }

  // Return only basic details
  return {
    _id: profileObj._id,
    name: profileObj.name,
    age: profileObj.age,
    gender: profileObj.gender,
    location: profileObj.location,
    profession: profileObj.profession,
    education: profileObj.education,
    height: profileObj.height,
    imageUrl: profileObj.imageUrl,
    bio: profileObj.bio,
    isPremium: profileObj.isPremium,
    isVerified: profileObj.isVerified,
    hasRestrictedAccess: true, // Flag to show user needs to pay
    restrictedFields: [
      "phoneNumber",
      "whatsappNumber",
      "caste",
      "gotra",
      "familyDetails",
      "income",
    ],
  };
}

router.get("/me", authorize, async (req, res) => {
  console.log("\n=== GET MY PROFILE ===");
  console.log("User ID:", req.user.id);

  try {
    const profile = await Profile.findOne({ createdBy: req.user.id });

    if (!profile) {
      console.log("⚠️  No profile found for user:", req.user.id);
      return res.status(404).json({
        success: false,
        msg: "No profile found for this user",
      });
    }

    console.log("✅ Profile found:", profile._id);
    res.json({
      success: true,
      profile,
    });
  } catch (err) {
    console.error("❌ Error fetching profile:", err.message);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: err.message,
    });
  }
});

// @route   POST /api/profiles
// @desc    Create or update user profile
router.post("/", authorize, upload.single("image"), async (req, res) => {
  console.log("\n=== CREATE/UPDATE PROFILE ===");
  console.log("User ID:", req.user ? req.user.id : "No User");
  console.log("Form Data:", req.body);

  if (req.file) {
    console.log("File received:", req.file.path);
  } else {
    console.log("No image file received");
  }

  try {
    const profileFields = {
      name: req.body.name,
      gender: req.body.gender,
      age: req.body.age ? parseInt(req.body.age) : undefined,
      dob: req.body.dob ? new Date(req.body.dob) : undefined,
      location: req.body.location,
      profession: req.body.profession,
      education: req.body.education,
      height: req.body.height,
      income: req.body.income,
      bio: req.body.bio,
      createdBy: req.user.id,
    };

    // Remove undefined fields
    Object.keys(profileFields).forEach(
      (key) => profileFields[key] === undefined && delete profileFields[key],
    );

    // Add image if uploaded
    if (req.file) {
      profileFields.imageUrl = req.file.path;
      profileFields.cloudinaryId = req.file.filename;
      console.log("✅ Image URL added:", req.file.path);
    }

    console.log("Attempting to save/update profile...");

    let profile = await Profile.findOneAndUpdate(
      { createdBy: req.user.id },
      { $set: profileFields },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    console.log("✅ Profile saved successfully:", profile._id);
    res.status(201).json({
      success: true,
      profile,
    });
  } catch (err) {
    console.error("❌ Error saving profile:", err.message);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        msg: "Validation Error",
        errors: errors,
      });
    }
    res.status(500).json({
      success: false,
      msg: "Database save failed",
      error: err.message,
    });
  }
});

router.get("/", async (req, res) => {
  console.log("\n=== GET ALL PROFILES ===");

  try {
    const { gender, location, minAge, maxAge, isPremium } = req.query;

    let filter = {};

    if (gender) filter.gender = gender;
    if (location) filter.location = new RegExp(location, "i");
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = parseInt(minAge);
      if (maxAge) filter.age.$lte = parseInt(maxAge);
    }
    if (isPremium !== undefined) filter.isPremium = isPremium === "true";

    const profiles = await Profile.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email");

    // Filter profiles to show only basic details
    const filteredProfiles = profiles.map((profile) =>
      filterProfileData(profile, false),
    );

    console.log(`✅ Found ${profiles.length} profiles (basic details only)`);

    res.json({
      success: true,
      count: profiles.length,
      profiles: filteredProfiles,
    });
  } catch (err) {
    console.error("❌ Error fetching profiles:", err.message);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: err.message,
    });
  }
});

router.get("/:id", authorize, async (req, res) => {
  console.log("\n=== GET PROFILE BY ID ===");
  console.log("Profile ID:", req.params.id);
  console.log("User ID:", req.user?.id);

  try {
    const profile = await Profile.findById(req.params.id).populate(
      "createdBy",
      "fullName email",
    );

    if (!profile) {
      console.log("❌ Profile not found");
      return res.status(404).json({
        success: false,
        msg: "Profile not found",
      });
    }

    // Check if user has access
    let hasAccess = false;
    if (req.user) {
      // Check if user owns the profile or is admin
      if (
        profile.createdBy._id.toString() === req.user.id ||
        req.user.role === "admin"
      ) {
        hasAccess = true;
      } else {
        // Check if user has approved access request
        hasAccess = await hasAccessToPremiumDetails(req.user.id, req.params.id);
      }
    }

    const filteredProfile = filterProfileData(profile, hasAccess);

    console.log("✅ Profile found:", profile.name);
    console.log("Access level:", hasAccess ? "FULL" : "BASIC");

    res.json({
      success: true,
      profile: filteredProfile,
      hasFullAccess: hasAccess,
    });
  } catch (err) {
    console.error("❌ Error fetching profile:", err.message);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: err.message,
    });
  }
});

// @route   DELETE /api/profiles/:id
// @desc    Delete a profile (Owner or Admin only)
router.delete("/:id", authorize, async (req, res) => {
  console.log("\n=== DELETE PROFILE ===");
  console.log("Profile ID:", req.params.id);
  console.log("User ID:", req.user.id);

  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        msg: "Profile not found",
      });
    }

    // Check if user owns the profile or is admin
    if (
      profile.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        msg: "Not authorized to delete this profile",
      });
    }

    await Profile.findByIdAndDelete(req.params.id);

    console.log("✅ Profile deleted successfully");
    res.json({
      success: true,
      msg: "Profile deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting profile:", err.message);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: err.message,
    });
  }
});

// @route   PUT /api/profiles/:id
// @desc    Update a profile (Owner or Admin only)
router.put("/:id", authorize, upload.single("image"), async (req, res) => {
  console.log("\n=== UPDATE PROFILE ===");
  console.log("Profile ID:", req.params.id);

  try {
    let profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        msg: "Profile not found",
      });
    }

    // Check if user owns the profile or is admin
    if (
      profile.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        msg: "Not authorized to update this profile",
      });
    }

    const updateFields = { ...req.body };

    // Handle image upload
    if (req.file) {
      updateFields.imageUrl = req.file.path;
      updateFields.cloudinaryId = req.file.filename;
    }

    profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    console.log("✅ Profile updated successfully");
    res.json({
      success: true,
      profile: profile,
    });
  } catch (err) {
    console.error("❌ Error updating profile:", err.message);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: err.message,
    });
  }
});

module.exports = router;
