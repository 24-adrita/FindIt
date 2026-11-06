// backend/src/routes/matchRoutes.js
// ------------------------------------------------------------
// Protected route that proxies a matching request to the FastAPI AI service.
// ------------------------------------------------------------

const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth");
const ItemReport = require("../models/ItemReport");

// Helper: validate a MongoDB ObjectId (24 hex chars)
function isValidObjectId(id) {
  return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
}

// POST /api/match
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { lostItemId, topK } = req.body;

    // ---- Input validation -------------------------------------------------
    if (!lostItemId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: lostItemId",
      });
    }
    if (!isValidObjectId(lostItemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lostItemId – must be a 24‑character hex string",
      });
    }
    if (topK !== undefined) {
      if (typeof topK !== "number" || !Number.isInteger(topK) || topK < 1 || topK > 20) {
        return res.status(400).json({
          success: false,
          message: "topK must be an integer between 1 and 20",
        });
      }
    }

    // ---- Verify the item exists and is a lost report ----------------------
    const item = await ItemReport.findById(lostItemId).lean();
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Lost item not found",
      });
    }
    if ((item.type || "").toLowerCase() !== "lost") {
      return res.status(400).json({
        success: false,
        message: "Item type must be \"lost\" for matching",
      });
    }

    // ---- Build request to AI service --------------------------------------
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8001";
const port = process.env.AI_SERVICE_PORT || "8001";
const aiUrl = `http://${host}:${port}/api/match`;
    const aiUrl = `${aiBase.replace(/\/*$/, "")}/api/match`;
    const payload = { lostItemId };
    if (topK !== undefined) payload.topK = Number(topK);

    // Timeout handling – Node 24 provides AbortSignal.timeout()
    const timeoutMs = Number(process.env.AI_MATCH_TIMEOUT_MS) || 8000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(aiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    // ---- Forward AI service response --------------------------------------
    const responseData = await response.json().catch(() => null);
    if (response.ok) {
      return res.status(200).json(responseData);
    }

    // Propagate error from AI service
    return res.status(response.status).json(
      responseData && typeof responseData === "object"
        ? responseData
        : { success: false, message: "AI service error" }
    );
  } catch (err) {
    // ---- Network / timeout / unexpected errors ---------------------------
    if (err.name === "AbortError") {
      return res.status(504).json({
        success: false,
        message: "AI service request timed out",
      });
    }
    console.error("⚠️ Match route error:", err);
    return res.status(502).json({
      success: false,
      message: "Unable to communicate with AI matching service",
    });
  }
});

module.exports = router;
