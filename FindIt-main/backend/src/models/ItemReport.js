const mongoose = require("mongoose");

const ALLOWED_CATEGORIES = [
  "electronics",
  "id_cards",
  "keys",
  "bags_wallets",
  "clothing",
  "books_notes",
  "bottles_accessories",
  "other",
];

const ALLOWED_TYPES = ["lost", "found"];
const ALLOWED_STATUSES = ["active", "matched", "claimed", "resolved"];

const ItemReportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Report type is required (must be 'lost' or 'found')"],
      enum: {
        values: ALLOWED_TYPES,
        message: "{VALUE} is not a valid report type ('lost' or 'found')",
      },
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    category: {
      type: String,
      required: [true, "Item category is required"],
      enum: {
        values: ALLOWED_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      lowercase: true,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      default: "",
      maxlength: [80, "Brand cannot exceed 80 characters"],
    },
    primaryColor: {
      type: String,
      trim: true,
      default: "Black",
    },
    secondaryColor: {
      type: String,
      trim: true,
      default: "None",
    },
    description: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    uniqueMarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Unique marks cannot exceed 500 characters"],
    },
    // CRITICAL SECURITY REQUIREMENT:
    // Treated as private verification information. select: false prevents this
    // from being returned in standard queries unless explicitly selected by an admin.
    secretVerificationDetail: {
      type: String,
      trim: true,
      default: "",
      select: false,
    },
    location: {
      campusZone: {
        type: String,
        required: [true, "Campus zone is required"],
        trim: true,
      },
      specificLocation: {
        type: String,
        required: [true, "Specific location / landmark is required"],
        trim: true,
      },
    },
    dateTime: {
      type: Date,
      default: Date.now,
    },
    imagePaths: {
      type: [String],
      default: [],
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    imageEmbedding: {
      type: [Number],
      default: undefined,
      select: false,
    },
    textEmbedding: {
      type: [Number],
      default: undefined,
      select: false,
    },
    submitterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    submitterName: {
      type: String,
      required: [true, "Submitter name is required"],
      trim: true,
    },
    submitterStudentId: {
      type: String,
      trim: true,
      default: "",
    },
    submitterEmail: {
      type: String,
      required: [true, "Submitter email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    submitterPhone: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ALLOWED_STATUSES,
        message: "{VALUE} is not a valid status",
      },
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret, options) {
        // Safeguard: omit secretVerificationDetail unless explicitly authorized for admin review
        if (!options || !options.includeSecret) {
          delete ret.secretVerificationDetail;
        }
        return ret;
      },
    },
  }
);

// Indexes for common queries
ItemReportSchema.index({ type: 1, category: 1, status: 1 });
ItemReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ItemReport", ItemReportSchema);
