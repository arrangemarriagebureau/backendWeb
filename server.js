require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Connect to Database
connectDB();

// Middleware
app.use(cors());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-auth-token, Authorization",
  );
  res.header("Access-Control-Expose-Headers", "x-auth-token");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    console.log("✅ CORS Preflight - OPTIONS request handled for:", req.path);
    return res.sendStatus(200);
  }

  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (if you have a public folder)
app.use(express.static(path.join(__dirname, "public")));

// Request logger
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.path} - Origin: ${req.headers.origin || "No origin"}`,
  );
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/profiles", require("./routes/profile"));
app.use("/api/inquiries", require("./routes/inquiry"));

// Test Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Marriage Bureau API is running...",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test/db", async (req, res) => {
  try {
    const Profile = require("./models/Profile");
    const User = require("./models/User");
    const profileCount = await Profile.countDocuments();
    const userCount = await User.countDocuments();
    res.json({
      success: true,
      message: "Database connected",
      stats: {
        profiles: profileCount,
        users: userCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message,
    });
  }
});

app.get("/api/test/cors", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working!",
    origin: req.headers.origin,
    headers: req.headers,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({
    success: false,
    msg: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    msg: "Route not found",
    path: req.path,
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "192.168.1.10";

app.listen(PORT, HOST, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📡 Accessible at: http://${HOST}:${PORT}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📋 Available Routes:`);
  console.log(`   - POST http://${HOST}:${PORT}/api/auth/register`);
  console.log(`   - POST http://${HOST}:${PORT}/api/auth/login`);
  console.log(`   - GET  http://${HOST}:${PORT}/api/admin/users`);
  console.log(`   - POST http://${HOST}:${PORT}/api/admin/create-profile`);
  console.log(`   - GET  http://${HOST}:${PORT}/api/profiles`);
  console.log(`   - GET  http://${HOST}:${PORT}/api/profiles/me`);
  console.log(`   - POST http://${HOST}:${PORT}/api/profiles`);
  console.log(`\n   Test Routes:`);
  console.log(`   - GET  http://${HOST}:${PORT}/api/test/db`);
  console.log(`   - GET  http://${HOST}:${PORT}/api/test/cors`);
  console.log(`${"=".repeat(60)}\n`);
});
