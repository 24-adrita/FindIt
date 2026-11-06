const mongoose = require("mongoose");

const ALLOWED_TYPES = ["match_alert", "claim_approved", "claim_rejected", "system"];

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required for notification"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ALLOWED_TYPES,
        message: "{VALUE} is not a valid notification type",
      },
      required: [true, "Notification type is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    relatedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemReport",
      default: null,
      index: true,
    },
    relatedClaimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      default: null,
      index: true,
    },
    matchScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user query efficiency and duplicate suppression
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, relatedItemId: 1, relatedClaimId: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
