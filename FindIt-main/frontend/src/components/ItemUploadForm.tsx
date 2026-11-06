"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Sparkles,
  Info,
  Tag,
  Shield,
  User,
  FileText,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  ReportType,
  ItemCategory,
  UploadedImage,
  CAMPUS_LOCATIONS,
  ITEM_CATEGORIES,
  COMMON_COLORS,
  StoredItemReport,
} from "../types/item";
import { submitItemReport } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface ItemUploadFormProps {
  onReportCreated?: (report: StoredItemReport) => void;
  onRequireAuth?: () => void;
  initialType?: ReportType;
}

export default function ItemUploadForm({
  onReportCreated,
  onRequireAuth,
  initialType = "lost",
}: ItemUploadFormProps) {
  const { user, token } = useAuth();
  // Form State
  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [prevInitialType, setPrevInitialType] = useState(initialType);
  if (initialType !== prevInitialType) {
    setPrevInitialType(initialType);
    setReportType(initialType);
  }
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("electronics");
  const [brand, setBrand] = useState("");
  const [primaryColor, setPrimaryColor] = useState("Black");
  const [secondaryColor, setSecondaryColor] = useState("None");
  const [campusLocation, setCampusLocation] = useState(CAMPUS_LOCATIONS[0].id);
  const [specificLocation, setSpecificLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [description, setDescription] = useState("");
  const [uniqueMarks, setUniqueMarks] = useState("");
  const [secretVerificationHint, setSecretVerificationHint] = useState("");
  const [reporterName, setReporterName] = useState(user?.name || "");
  const [studentId, setStudentId] = useState(user?.studentId || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [consentPrivacy, setConsentPrivacy] = useState(true);

  // Sync user details when user state changes
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      if (!reporterName && user.name) setReporterName(user.name);
      if (!studentId && user.studentId) setStudentId(user.studentId);
      if (!contactEmail && user.email) setContactEmail(user.email);
      if (!contactPhone && user.phone) setContactPhone(user.phone);
    }
  }

  // Uploaded images state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>("");
  const [submittedReport, setSubmittedReport] = useState<StoredItemReport | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Image Upload Handlers
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadError(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    const maxImages = 4;

    if (images.length + files.length > maxImages) {
      setUploadError(`You can upload a maximum of ${maxImages} images.`);
      return;
    }

    const newUploaded: UploadedImage[] = [];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`"${file.name}" is not a supported format (JPG, PNG, WebP).`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setUploadError(`"${file.name}" exceeds the 5MB size limit.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newUploaded.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: file.size,
        previewUrl,
        file,
      });
    });

    setImages((prev) => [...prev, ...newUploaded]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target && target.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  // Helper date buttons
  const setQuickTime = (type: "now" | "today" | "yesterday") => {
    const d = new Date();
    if (type === "yesterday") {
      d.setDate(d.getDate() - 1);
    }
    setDateTime(d.toISOString().slice(0, 16));
  };

  // Validation
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!title.trim()) {
      errors.title = "Please enter an item title or headline.";
    } else if (title.trim().length < 3) {
      errors.title = "Item title must be at least 3 characters.";
    }

    if (!description.trim()) {
      errors.description = "Please provide a detailed description to assist multimodal matching.";
    } else if (description.trim().length < 15) {
      errors.description = "Description should be at least 15 characters for accurate S-BERT embeddings.";
    }

    if (!specificLocation.trim()) {
      errors.specificLocation = "Please specify a room, desk, landmark, or specific spot.";
    }

    if (!reporterName.trim()) {
      errors.reporterName = "Please provide your name.";
    }

    if (!contactEmail.trim()) {
      errors.contactEmail = "Please provide your contact email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errors.contactEmail = "Please enter a valid email address.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.keys(formErrors)[0];
      if (firstError) {
        const el = document.getElementById(firstError);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!token) {
      setServerError("Authentication required: Please log in or register your account before submitting an item report.");
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      setSubmissionStep("Preparing multimodal payload & images...");
      const formData = new FormData();
      formData.append("type", reportType);
      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("brand", brand.trim());
      formData.append("primaryColor", primaryColor);
      formData.append("secondaryColor", secondaryColor);
      formData.append("campusLocation", campusLocation);
      formData.append("specificLocation", specificLocation.trim());
      formData.append("dateTime", dateTime || new Date().toISOString().slice(0, 16));
      formData.append("description", description.trim());
      formData.append("uniqueMarks", uniqueMarks.trim());
      formData.append("secretVerificationDetail", secretVerificationHint.trim());
      formData.append("submitterName", reporterName.trim());
      formData.append("submitterStudentId", studentId.trim());
      formData.append("submitterEmail", contactEmail.trim());
      formData.append("submitterPhone", contactPhone.trim());

      // Append uploaded image files
      images.forEach((img) => {
        if (img.file) {
          formData.append("images", img.file);
        }
      });

      setSubmissionStep(
        images.length > 0
          ? `Uploading ${images.length} photo(s) & indexing in MongoDB...`
          : "Indexing report in MongoDB..."
      );

      // Submit to Express REST backend (POST /api/items) with JWT token
      const savedReport = await submitItemReport(formData, token);

      setIsSubmitting(false);
      setSubmittedReport(savedReport);

      // Reset form inputs only after successful submission
      setTitle("");
      setBrand("");
      setSpecificLocation("");
      setDescription("");
      setUniqueMarks("");
      setSecretVerificationHint("");
      setImages([]);
      setFormErrors({});
      setServerError(null);

      // Notify parent feed component
      if (onReportCreated) {
        onReportCreated(savedReport);
      }
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      setIsSubmitting(false);
      const message =
        err instanceof Error
          ? err.message
          : "Could not connect to the backend server. Please verify Express is running on port 5000 and MongoDB is active.";
      setServerError(message);
    }
  };

  const resetForm = () => {
    setSubmittedReport(null);
    setServerError(null);
    setTitle("");
    setBrand("");
    setSpecificLocation("");
    setDescription("");
    setUniqueMarks("");
    setSecretVerificationHint("");
    setImages([]);
    setFormErrors({});
  };

  // Theme accents
  const isLost = reportType === "lost";
  const theme = {
    badge: isLost ? "bg-[#171A18] text-[#F3F4EF] border-[#383E39]" : "bg-[#45B58A]/15 text-[#45B58A] border-[#45B58A]/30",
    ringFocus: "focus:ring-1 focus:ring-[#45B58A] focus:border-[#45B58A]",
    buttonPrimary: "bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold shadow-md",
  };

  return (
    <div id="report-form" className="w-full max-w-4xl mx-auto text-[#F3F4EF]">
      {/* Success Modal / Receipt */}
      {submittedReport && (
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-[#252B27] border border-[#45B58A] shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#171A18] text-[#45B58A] border border-[#383E39] rounded-2xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30">
                    Report Registered Successfully
                  </span>
                  <h3 className="text-2xl font-bold text-[#F3F4EF] mt-1">
                    {submittedReport.reportType === "lost" ? "Lost Item Report" : "Found Item Report"} #{submittedReport.id}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#A9B0AA] block">System Tracking Code</span>
                  <span className="text-sm font-mono font-bold text-[#45B58A] bg-[#171A18] px-2.5 py-1 rounded-md border border-[#383E39]">
                    {submittedReport.id}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-[#171A18] border border-[#383E39] grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-xs text-[#A9B0AA] block font-medium">Item Title</span>
                  <p className="font-semibold text-[#F3F4EF]">{submittedReport.title}</p>
                </div>
                <div>
                  <span className="text-xs text-[#A9B0AA] block font-medium">Category</span>
                  <p className="font-semibold text-[#F3F4EF] capitalize">
                    {submittedReport.category.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#A9B0AA] block font-medium">Sylhet Location Hub</span>
                  <p className="font-semibold text-[#F3F4EF]">
                    {CAMPUS_LOCATIONS.find((l) => l.id === submittedReport.campusLocation)?.name ||
                      submittedReport.campusLocation}
                  </p>
                </div>
              </div>

              {/* Multimodal embeddings preview */}
              <div className="mt-4 p-3.5 rounded-xl bg-[#171A18] border border-[#383E39] text-xs text-[#A9B0AA] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#45B58A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#F3F4EF]">AI Multimodal Pipeline Status:</span>
                  <p className="mt-0.5 text-[#A9B0AA]">
                    {submittedReport.images.length > 0
                      ? `Successfully extracted OpenCLIP 512-dim visual embeddings from ${submittedReport.images.length} photo(s) & Sentence Transformer tokens from description.`
                      : "No photos provided. Activated zero-shot text-only semantic matching pipeline (re-weighted to text description + attributes)."}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl font-medium text-sm text-[#A9B0AA] bg-[#171A18] border border-[#383E39] hover:text-[#F3F4EF] hover:bg-[#383E39] transition cursor-pointer"
                >
                  Submit Another Report
                </button>
                <a
                  href="#recent-items"
                  className="px-5 py-2.5 rounded-xl font-medium text-sm text-[#171A18] bg-[#45B58A] hover:bg-[#3ca37c] font-bold shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  View Sylhet Feed
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Form Container */}
      <div className="bg-[#252B27] rounded-3xl shadow-2xl border border-[#383E39] overflow-hidden text-[#F3F4EF]">
        {/* Banner with Lost vs Found Toggle */}
        <div className="p-6 sm:p-8 bg-[#1E2320] border-b border-[#383E39] text-[#F3F4EF]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#171A18] text-[#45B58A] border border-[#383E39]">
                <Sparkles className="w-3.5 h-3.5" />
                Sylhet Multimodal AI Intake
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-[#F3F4EF]">
                {isLost ? "Report a Lost Item" : "Report a Found Item"}
              </h2>
              <p className="text-sm text-[#A9B0AA] mt-1 max-w-xl">
                {isLost
                  ? "Describe what you lost. Our multimodal AI compares your photos and descriptions against all found items across Sylhet."
                  : "Found something in Sylhet? Register it here to help the rightful owner find and safely claim it."}
              </p>
            </div>

            {/* Type Switcher Buttons */}
            <div className="bg-[#171A18] p-1.5 rounded-2xl flex items-center border border-[#383E39] self-start sm:self-center">
              <button
                type="button"
                onClick={() => setReportType("lost")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isLost
                    ? "bg-[#252B27] text-[#F3F4EF] border border-[#383E39] shadow-sm"
                    : "text-[#A9B0AA] hover:text-[#F3F4EF]"
                }`}
              >
                🔍 I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setReportType("found")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  !isLost
                    ? "bg-[#45B58A] text-[#171A18] shadow-sm font-bold"
                    : "text-[#A9B0AA] hover:text-[#F3F4EF]"
                }`}
              >
                🎁 I Found Something
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Item Basic Info */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#383E39]">
              <Tag className="w-5 h-5 text-[#45B58A]" />
              <h3 className="text-base font-bold text-[#F3F4EF]">
                1. Item Classification & Basic Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Item Title */}
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Item Title / Headline <span className="text-[#45B58A]">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    isLost
                      ? "e.g., Space Grey MacBook Air M2 with astronaut sticker"
                      : "e.g., Set of keys with blue Subaru fob and gym tag"
                  }
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    formErrors.title ? "border-rose-500/80 bg-rose-950/20" : "border-[#383E39] bg-[#171A18]"
                  } text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]`}
                />
                {formErrors.title && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Category <span className="text-[#45B58A]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-sm text-[#F3F4EF] focus:outline-none focus:border-[#45B58A]"
                >
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#171A18] text-[#F3F4EF]">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand / Model */}
              <div>
                <label className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., Apple, Dell, Nike, Hydro Flask, Sony"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]"
                />
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Primary Color
                </label>
                <select
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-sm text-[#F3F4EF] focus:outline-none focus:border-[#45B58A]"
                >
                  {COMMON_COLORS.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#171A18] text-[#F3F4EF]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Secondary / Accent Color
                </label>
                <select
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-sm text-[#F3F4EF] focus:outline-none focus:border-[#45B58A]"
                >
                  <option value="None" className="bg-[#171A18] text-[#F3F4EF]">None / Single Tone</option>
                  {COMMON_COLORS.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#171A18] text-[#F3F4EF]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Multimodal Image Upload */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#383E39]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#45B58A]" />
                <h3 className="text-base font-bold text-[#F3F4EF]">
                  2. Visual Image Upload (OpenCLIP Matching)
                </h3>
              </div>
              <span className="text-xs text-[#A9B0AA] font-medium">Up to 4 images (5MB max each)</span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-[#45B58A] bg-[#171A18] scale-[1.01]"
                  : "border-[#383E39] hover:border-[#45B58A]/70 bg-[#171A18]/60 hover:bg-[#171A18]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-3">
                <div className="p-3 bg-[#252B27] rounded-2xl border border-[#383E39] text-[#45B58A]">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F3F4EF]">
                    <span className="text-[#45B58A] underline">Click to upload photos</span> or drag and drop
                  </p>
                  <p className="text-xs text-[#A9B0AA] mt-1">
                    Supports JPG, PNG, and WebP (up to 5MB each)
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                {uploadError}
              </div>
            )}

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-semibold text-[#A9B0AA] block mb-2">
                  Uploaded Images ({images.length}/4):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-xl border border-[#383E39] overflow-hidden bg-[#171A18] shadow-xs"
                    >
                      <img
                        src={img.previewUrl}
                        alt={img.name}
                        className="w-full h-28 object-cover group-hover:scale-105 transition duration-200"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#171A18]/80 text-[#F3F4EF] hover:bg-rose-600 transition"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="p-1.5 bg-[#252B27] border-t border-[#383E39] text-[10px] text-[#A9B0AA] truncate">
                        {img.name} ({(img.size / 1024).toFixed(0)} KB)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explainable AI Notice for Missing Images */}
            <div className="mt-3 p-3 rounded-xl bg-[#171A18] border border-[#383E39] text-xs text-[#A9B0AA] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#45B58A] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[#F3F4EF]">Multimodal AI Notice:</strong> Don&apos;t have a photo? No problem! The system will dynamically distribute visual weight to your semantic text description and categorical tags.
              </p>
            </div>
          </div>

          {/* Section 3: Spatiotemporal Details */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#383E39]">
              <MapPin className="w-5 h-5 text-[#45B58A]" />
              <h3 className="text-base font-bold text-[#F3F4EF]">
                3. Sylhet Location &amp; Time Proximity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sylhet Hub / Campus Zone */}
              <div>
                <label className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Sylhet Area / Transit Hub / Campus <span className="text-[#45B58A]">*</span>
                </label>
                <select
                  value={campusLocation}
                  onChange={(e) => setCampusLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-sm text-[#F3F4EF] focus:outline-none focus:border-[#45B58A]"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-[#171A18] text-[#F3F4EF]">
                      {loc.name} ({loc.zone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Exact Spot / Landmark */}
              <div>
                <label htmlFor="specificLocation" className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Exact Spot / Landmark / Room <span className="text-[#45B58A]">*</span>
                </label>
                <input
                  id="specificLocation"
                  type="text"
                  value={specificLocation}
                  onChange={(e) => setSpecificLocation(e.target.value)}
                  placeholder="e.g., 2nd Floor Quiet Study, Desk 24 or Cafeteria Booth"
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    formErrors.specificLocation ? "border-rose-500/80 bg-rose-950/20" : "border-[#383E39] bg-[#171A18]"
                  } text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]`}
                />
                {formErrors.specificLocation && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.specificLocation}
                  </p>
                )}
              </div>

              {/* Date & Time */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider">
                    {isLost ? "Date & Time Last Seen" : "Date & Time Found"} <span className="text-[#45B58A]">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickTime("now")}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#171A18] border border-[#383E39] text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] transition"
                    >
                      Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTime("today")}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#171A18] border border-[#383E39] text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] transition"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTime("yesterday")}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#171A18] border border-[#383E39] text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] transition"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-sm text-[#F3F4EF] focus:outline-none focus:border-[#45B58A]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Detailed Description & Verification Attributes */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#383E39]">
              <FileText className="w-5 h-5 text-[#45B58A]" />
              <h3 className="text-base font-bold text-[#F3F4EF]">
                4. Semantic Description & Explainable Attributes
              </h3>
            </div>

            <div className="space-y-4">
              {/* Detailed Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Full Semantic Description <span className="text-[#45B58A]">*</span>
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item in natural language. Mention materials, size, condition, contents, or any context."
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    formErrors.description ? "border-rose-500/80 bg-rose-950/20" : "border-[#383E39] bg-[#171A18]"
                  } text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]`}
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Unique Marks */}
              <div>
                <label className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Distinguishing Features & Marks
                </label>
                <input
                  type="text"
                  value={uniqueMarks}
                  onChange={(e) => setUniqueMarks(e.target.value)}
                  placeholder="e.g., Scratch on bottom-left, GitHub sticker on lid, broken zipper pull"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]"
                />
              </div>

              {/* Secret Verification Hint */}
              <div className="p-4 rounded-2xl bg-[#171A18] border border-[#383E39]">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-[#45B58A]" />
                  <label className="text-xs font-bold text-[#F3F4EF] uppercase tracking-wider">
                    Secret Verification Detail (Admin Anti-Fraud Safeguard)
                  </label>
                </div>
                <p className="text-xs text-[#A9B0AA] mb-2">
                  {isLost
                    ? "Provide a private detail only the true owner would know (e.g. lock screen photo, interior pocket contents, engraving initials)."
                    : "If the found item contains hidden details (e.g., specific student name card, distinct keychain), note what a claimer must identify."}
                </p>
                <input
                  type="text"
                  value={secretVerificationHint}
                  onChange={(e) => setSecretVerificationHint(e.target.value)}
                  placeholder="e.g., Phone wallpaper is a golden retriever named Max; 3 silver coins in front pocket"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#252B27] text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Submitter Contact Information */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#383E39]">
              <User className="w-5 h-5 text-[#45B58A]" />
              <h3 className="text-base font-bold text-[#F3F4EF]">
                5. Reporter Contact & Verification
              </h3>
            </div>

            {user ? (
              <div className="mb-4 p-3.5 rounded-xl bg-[#171A18] border border-[#383E39] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#45B58A] animate-pulse" />
                  <span className="text-xs text-[#A9B0AA]">
                    Verified session: Submitting as <strong className="text-[#F3F4EF]">{user.name}</strong> ({user.email})
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30">
                  {user.role === "admin" ? "ADMIN" : "CITIZEN"}
                </span>
              </div>
            ) : (
              <div className="mb-4 p-3.5 rounded-xl bg-[#171A18] border border-[#383E39] text-[#A9B0AA] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#45B58A] shrink-0 mt-0.5 sm:mt-0" />
                  <span>You must be logged in to register an item in the system.</span>
                </div>
                {onRequireAuth && (
                  <button
                    type="button"
                    onClick={onRequireAuth}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-xs transition shrink-0"
                  >
                    Log In / Register
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label htmlFor="reporterName" className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Your Full Name <span className="text-[#45B58A]">*</span>
                </label>
                <input
                  id="reporterName"
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g., Alex Johnson"
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    formErrors.reporterName ? "border-rose-500/80 bg-rose-950/20" : "border-[#383E39] bg-[#171A18]"
                  } text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]`}
                />
                {formErrors.reporterName && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.reporterName}
                  </p>
                )}
              </div>

              {/* Student / Citizen ID */}
              <div>
                <label className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  National ID (NID) / Student ID (Optional)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 2026-CSE / NID No."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="contactEmail" className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Contact Email <span className="text-[#45B58A]">*</span>
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="alex.johnson@university.edu"
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    formErrors.contactEmail ? "border-rose-500/80 bg-rose-950/20" : "border-[#383E39] bg-[#171A18]"
                  } text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]`}
                />
                {formErrors.contactEmail && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.contactEmail}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-sm text-[#F3F4EF] placeholder:text-[#A9B0AA]/40 focus:outline-none focus:border-[#45B58A]"
                />
              </div>

              {/* Privacy consent checkbox */}
              <div className="sm:col-span-2 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentPrivacy}
                    onChange={(e) => setConsentPrivacy(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#383E39] bg-[#171A18] text-[#45B58A] focus:ring-[#45B58A]"
                  />
                  <span className="text-xs text-[#A9B0AA] leading-relaxed">
                    I understand that submitted data will be processed by the campus multimodal matching system and stored in the secure university repository. Contact details remain confidential until an administrator validates a genuine match.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Backend / Database Error:</span>
                <p className="mt-0.5">{serverError}</p>
                <p className="mt-1 text-[11px] text-rose-400">
                  Tip: Ensure the Express backend is running on port 5000 (`npm run dev` in the backend folder) and MongoDB is active.
                </p>
              </div>
            </div>
          )}

          {/* Submission Bar */}
          <div className="pt-4 border-t border-[#383E39] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#A9B0AA]">
              <Sparkles className="w-4 h-4 text-[#45B58A]" />
              <span>Initial match weights: 0.40 Img, 0.25 Txt, 0.15 Loc, 0.10 Time, 0.10 Attr</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !consentPrivacy}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${theme.buttonPrimary} cursor-pointer`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{submissionStep || "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <span>Submit {isLost ? "Lost" : "Found"} Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
