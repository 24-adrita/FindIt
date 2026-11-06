const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const {
  getJwtSecret,
  loginLimiter,
  registerLimiter,
  googleAuthLimiter,
} = require("../config/security");

const router = express.Router();

/**
 * Helper to generate signed JWT token for an authenticated user.
 */
function generateToken(user) {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    secret,
    { expiresIn }
  );
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student account (public registration CANNOT create admins)
 * @access  Public
 */
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { name, email, password, studentId, phone, role } = req.body;

    // 1. Validate mandatory fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // 2. Strict Security: Block public registration from granting admin role
    if (role && role.toLowerCase() === "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Administrator accounts cannot be created via public registration.",
      });
    }

    // 3. Check for existing account with the same email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists. Please log in.",
      });
    }

    // 4. Create student user
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      studentId: (studentId || "").trim(),
      phone: (phone || "").trim(),
      role: "student", // Always force student role
    });

    await newUser.save();

    // 5. Generate JWT token
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error during registration.",
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials and return signed JWT token
 * @access  Public
 */
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and explicitly select password hash
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify bcrypt password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Cryptographically verify Google ID token and issue JWT session
 * @access  Public
 */
router.post("/google", googleAuthLimiter, async (req, res) => {
  try {
    const { idToken, credential, token, studentId, phone } = req.body;
    const rawGoogleToken = idToken || credential || token;

    // 1. Mandatory Google credential check
    if (!rawGoogleToken || typeof rawGoogleToken !== "string" || !rawGoogleToken.trim()) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required. Please provide a valid Google credential.",
      });
    }

    // 2. Server configuration check
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId || !googleClientId.trim()) {
      return res.status(503).json({
        success: false,
        message:
          "Google Sign-In is not configured on this server. GOOGLE_CLIENT_ID environment variable is missing.",
      });
    }

    // 3. Cryptographic token verification via Google's official library
    const client = new OAuth2Client(googleClientId.trim());
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: rawGoogleToken.trim(),
        audience: googleClientId.trim(),
      });
    } catch (verifyErr) {
      return res.status(401).json({
        success: false,
        message: `Google token verification failed: ${verifyErr.message}`,
      });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google token payload.",
      });
    }

    // 4. Validate issuer (accounts.google.com or https://accounts.google.com)
    if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") {
      return res.status(401).json({
        success: false,
        message: "Invalid token issuer. Expected accounts.google.com.",
      });
    }

    // 5. Validate email_verified status
    if (!payload.email_verified) {
      return res.status(401).json({
        success: false,
        message: "Google email address is not verified by Google.",
      });
    }

    const verifiedEmail = (payload.email || "").trim().toLowerCase();
    if (!verifiedEmail) {
      return res.status(401).json({
        success: false,
        message: "Google token did not contain a valid email address.",
      });
    }

    const verifiedName = (payload.name || payload.given_name || "Google User").trim();

    // 6. Prevent Privilege Escalation & Account Takeover
    let user = await User.findOne({ email: verifiedEmail });
    if (user) {
      // Strictly prevent administrator accounts from being accessed via Google OAuth bypass
      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: Administrator accounts cannot be accessed via Google Sign-In. Please use standard password authentication.",
        });
      }
    } else {
      // 7. Create new student user from verified Google identity
      const randomPassword = crypto.randomBytes(32).toString("hex") + "Aa1!";
      user = new User({
        name: verifiedName,
        email: verifiedEmail,
        password: randomPassword,
        studentId: (studentId || "").trim(),
        phone: (phone || "").trim(),
        role: "student", // Always force student role
      });
      await user.save();
    }

    // 8. Issue signed custom JWT token
    const jwtToken = generateToken(user);
    return res.status(200).json({
      success: true,
      message: "Google authentication successful.",
      token: jwtToken,
      user,
    });
  } catch (error) {
    console.error("❌ Google authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during Google authentication.",
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get profile of the currently authenticated user
 * @access  Private (Authenticated)
 */
router.get("/me", authenticateToken, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
