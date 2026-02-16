const express = require("express");
const router = express.Router();
const authorize = require("../middleware/auth");
const AccessRequest = require("../models/AccessRequest");
const Profile = require("../models/Profile");
const { upload } = require("../config/cloudinary");

// @route   POST /api/access-requests
// @desc    Submit access request with UTR number
router.post("/", authorize, upload.single("paymentProof"), async (req, res) => {
  console.log("\n=== CREATE ACCESS REQUEST ===");
  console.log("User ID:", req.user.id);
  console.log("Body:", req.body);

  try {
    const {
      profileId,
      profileName,
      userName,
      userEmail,
      userPhone,
      amountPaid,
      utrNumber,
      paymentMethod,
    } = req.body;

    // Validate required fields
    if (
      !profileId ||
      !profileName ||
      !userName ||
      !userEmail ||
      !userPhone ||
      !amountPaid ||
      !utrNumber ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required including UTR number",
      });
    }

    // Validate UTR number format (12 digits typically)
    const utrRegex = /^[A-Z0-9]{12,}$/i;
    if (!utrRegex.test(utrNumber)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid UTR number format. Must be at least 12 characters.",
      });
    }

    // Check if profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        msg: "Profile not found",
      });
    }

    // Check if UTR number already exists
    const existingUTR = await AccessRequest.findOne({
      utrNumber: utrNumber.toUpperCase(),
    });

    if (existingUTR) {
      return res.status(400).json({
        success: false,
        msg: "This UTR number has already been used. Please check your transaction or contact admin.",
      });
    }

    // Check if user already has a request for this profile
    const existingRequest = await AccessRequest.findOne({
      userId: req.user.id,
      profileId: profileId,
    });

    if (existingRequest) {
      if (existingRequest.status === "approved") {
        return res.status(400).json({
          success: false,
          msg: "You already have access to this profile",
        });
      }
      if (existingRequest.status === "pending") {
        return res.status(400).json({
          success: false,
          msg: "Your access request is pending approval",
        });
      }
    }

    // Create access request
    const accessRequest = new AccessRequest({
      profileId,
      profileName,
      userId: req.user.id,
      userName,
      userEmail,
      userPhone,
      amountPaid: parseFloat(amountPaid),
      utrNumber: utrNumber.toUpperCase(),
      paymentMethod,
      paymentProof: req.file ? req.file.path : null,
      paymentProofCloudinaryId: req.file ? req.file.filename : null,
      status: "pending",
    });

    await accessRequest.save();

    console.log("✅ Access request created:", accessRequest._id);
    console.log("   UTR:", accessRequest.utrNumber);

    res.status(201).json({
      success: true,
      msg: "Access request submitted successfully. Admin will review your payment.",
      accessRequest,
    });
  } catch (error) {
    console.error("❌ Error creating access request:", error);

    // Handle duplicate UTR error
    if (error.code === 11000 && error.keyPattern.utrNumber) {
      return res.status(400).json({
        success: false,
        msg: "This UTR number has already been used",
      });
    }

    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: error.message,
    });
  }
});

// @route   GET /api/access-requests
// @desc    Get all access requests (Admin only)
router.get("/", authorize, async (req, res) => {
  console.log("\n=== GET ALL ACCESS REQUESTS ===");

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Admin only.",
      });
    }

    const requests = await AccessRequest.find()
      .populate("userId", "fullName email")
      .populate("profileId", "name imageUrl")
      .sort({ createdAt: -1 });

    console.log(`✅ Retrieved ${requests.length} access requests`);

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("❌ Error fetching access requests:", error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: error.message,
    });
  }
});

// @route   GET /api/access-requests/my
// @desc    Get current user's access requests
router.get("/my", authorize, async (req, res) => {
  console.log("\n=== GET MY ACCESS REQUESTS ===");

  try {
    const requests = await AccessRequest.find({ userId: req.user.id })
      .populate("profileId", "name imageUrl location profession")
      .sort({ createdAt: -1 });

    console.log(`✅ User has ${requests.length} access requests`);

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("❌ Error fetching user access requests:", error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: error.message,
    });
  }
});

// @route   GET /api/access-requests/check/:profileId
// @desc    Check if user has access to a profile
router.get("/check/:profileId", authorize, async (req, res) => {
  try {
    const accessRequest = await AccessRequest.findOne({
      userId: req.user.id,
      profileId: req.params.profileId,
      status: "approved",
    });

    res.json({
      success: true,
      hasAccess: !!accessRequest,
      request: accessRequest,
    });
  } catch (error) {
    console.error("❌ Error checking access:", error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: error.message,
    });
  }
});

// @route   PUT /api/access-requests/:id/approve
// @desc    Approve access request (Admin only)
router.put("/:id/approve", authorize, async (req, res) => {
  console.log("\n=== APPROVE ACCESS REQUEST ===");

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Admin only.",
      });
    }

    const request = await AccessRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: req.user.id,
        adminNotes: req.body.adminNotes || "",
      },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: "Access request not found",
      });
    }

    console.log("✅ Access request approved");
    console.log("   UTR:", request.utrNumber);

    res.json({
      success: true,
      msg: "Access request approved successfully",
      request,
    });
  } catch (error) {
    console.error("❌ Error approving request:", error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: error.message,
    });
  }
});

// @route   PUT /api/access-requests/:id/reject
// @desc    Reject access request (Admin only)
router.put("/:id/reject", authorize, async (req, res) => {
  console.log("\n=== REJECT ACCESS REQUEST ===");

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Admin only.",
      });
    }

    const request = await AccessRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: req.user.id,
        adminNotes: req.body.adminNotes || "",
      },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: "Access request not found",
      });
    }

    console.log("✅ Access request rejected");

    res.json({
      success: true,
      msg: "Access request rejected",
      request,
    });
  } catch (error) {
    console.error("❌ Error rejecting request:", error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: error.message,
    });
  }
});

// @route   GET /api/access-requests/stats/count
// @desc    Get access request statistics (Admin only)
router.get("/stats/count", authorize, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Admin only.",
      });
    }

    const total = await AccessRequest.countDocuments();
    const pending = await AccessRequest.countDocuments({ status: "pending" });
    const approved = await AccessRequest.countDocuments({ status: "approved" });
    const rejected = await AccessRequest.countDocuments({ status: "rejected" });

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: error.message,
    });
  }
});



module.exports = router;
