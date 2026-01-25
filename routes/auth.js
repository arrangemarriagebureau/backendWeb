const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// @route   POST /api/auth/register
// @desc    Register a new user
router.post("/register", async (req, res) => {
  console.log("\n=== REGISTRATION REQUEST ===");
  console.log("Body received:", req.body);
  
  try {
    const { fullName, email, password, age, gender, phone } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: "Please provide fullName, email, and password" 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("❌ User already exists:", email);
      return res.status(400).json({ 
        success: false,
        msg: "User already exists" 
      });
    }

    // Create new user
    user = new User({ 
      fullName, 
      email, 
      password, 
      age: age || null, 
      gender: gender || null, 
      phone: phone || null 
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    console.log("✅ User registered:", user.email);

    // Create JWT Token
    const payload = { 
      user: { 
        id: user.id, 
        role: user.role 
      } 
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          success: true,
          token,
          user: { 
            email: user.email, 
            fullName: user.fullName,
            role: user.role 
          },
        });
      }
    );
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ 
      success: false,
      msg: "Server Error",
      error: err.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post("/login", async (req, res) => {
  console.log("\n=== LOGIN REQUEST ===");
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: "Please provide email and password" 
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ 
        success: false,
        msg: "Invalid Credentials" 
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Invalid password for:", email);
      return res.status(400).json({ 
        success: false,
        msg: "Invalid Credentials" 
      });
    }

    console.log("✅ User logged in:", user.email, "| Role:", user.role);

    // Generate JWT with Role
    const payload = { 
      user: { 
        id: user.id, 
        role: user.role 
      } 
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          user: {
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
        });
      }
    );
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ 
      success: false,
      msg: "Server Error",
      error: err.message 
    });
  }
});

module.exports = router;