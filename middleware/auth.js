const jwt = require('jsonwebtoken');

// Simple authorization middleware
const authorize = async (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        console.log("❌ No token provided");
        return res.status(401).json({ 
            success: false,
            msg: 'No token, authorization denied' 
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        
        console.log("✅ Token verified - User ID:", req.user.id, "| Role:", req.user.role);
        next();
    } catch (err) {
        console.log("❌ Token verification failed:", err.message);
        res.status(401).json({ 
            success: false,
            msg: 'Token is not valid' 
        });
    }
};

module.exports = authorize;