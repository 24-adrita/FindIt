const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret } = require("../config/security");

/**
 * Middleware: Authenticates JWT token from Authorization header (Bearer <token>).
 * Verifies token signature, expiration, and ensures user account still exists in MongoDB.
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid Bearer token.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    let secret;
    try {
      secret = getJwtSecret();
    } catch (configErr) {
      console.error("❌ Authentication verification failed: JWT_SECRET is not configured.");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Authentication service is unavailable.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Authentication token has expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token signature.",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account associated with this token no longer exists.",
      });
    }

    // Attach verified user identity from trusted server-side DB
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication verification.",
    });
  }
}

/**
 * Reusable Role-Based Authorization Middleware.
 * Rejects requests if the authenticated user's role is not within allowedRoles.
 *
 * @param {string[]} allowedRoles Array of allowed roles, e.g. ['admin']
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before role verification.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: [${allowedRoles.join(
          ", "
        )}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
