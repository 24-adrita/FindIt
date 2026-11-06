const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/auth");

/**
 * @route   GET /api/notifications
 * @desc    Fetch notifications for the authenticated user with unread count
 * @access  Private (Authenticated)
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { unreadOnly, limit = 20, page = 1 } = req.query;

    const query = { userId: req.user._id };
    if (unreadOnly === "true" || unreadOnly === true) {
      query.isRead = false;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Fetch total matching notifications and current unread count concurrently
    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
      Notification.find(query)
        .populate("relatedItemId", "title category primaryColor status imageUrls")
        .populate("relatedClaimId", "status reviewNotes")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      total,
      unreadCount,
      page: pageNum,
      limit: limitNum,
      data: notifications,
    });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching notifications.",
    });
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a specific notification as read (with strict ownership check)
 * @access  Private (Authenticated)
 */
router.patch("/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid notification ID format: "${id}".`,
      });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: `Notification with ID "${id}" was not found.`,
      });
    }

    // Ownership security check: Users cannot modify another user's notifications
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to modify this notification.",
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      unreadCount,
      data: notification,
    });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating notification.",
    });
  }
});

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all unread notifications for the current user as read
 * @access  Private (Authenticated)
 */
router.patch("/read-all", authenticateToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while marking all notifications as read.",
    });
  }
});

module.exports = router;
