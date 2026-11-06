"use client";

import React, { useState } from "react";
import {
  X,
  ShieldAlert,
  Lock,
  FileText,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Tag,
} from "lucide-react";
import { StoredItemReport } from "../types/item";
import { submitClaim } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface ClaimModalProps {
  item: StoredItemReport | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimSubmitted?: () => void;
}

export default function ClaimModal({
  item,
  isOpen,
  onClose,
  onClaimSubmitted,
}: ClaimModalProps) {
  const { user, token } = useAuth();
  const [secretAnswer, setSecretAnswer] = useState("");
  const [proofDetails, setProofDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("You must be logged in to your account to file an ownership claim.");
      return;
    }

    if (!secretAnswer.trim() || !proofDetails.trim()) {
      setError("Please fill in both the secret verification answer and proof details.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitClaim(
        {
          itemId: item._id || item.id,
          secretVerificationAnswer: secretAnswer.trim(),
          proofDetails: proofDetails.trim(),
        },
        token
      );

      setIsSuccess(true);
      if (onClaimSubmitted) {
        onClaimSubmitted();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit ownership claim.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSecretAnswer("");
    setProofDetails("");
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171A18]/80 backdrop-blur-md transition-all animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#252B27] rounded-3xl shadow-2xl border border-[#383E39] overflow-hidden max-h-[90vh] flex flex-col text-[#F3F4EF]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#383E39] bg-[#1E2320]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#171A18] text-[#45B58A] border border-[#383E39]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F3F4EF]">
                Submit Ownership Claim
              </h3>
              <p className="text-xs text-[#A9B0AA]">
                Human-in-the-Loop Admin & Desk Ownership Verification
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Item Summary Card */}
          <div className="p-4 rounded-2xl bg-[#171A18] border border-[#383E39] flex flex-col sm:flex-row gap-4">
            {item.imageUrls && item.imageUrls.length > 0 ? (
              <img
                src={item.imageUrls[0]}
                alt={item.title}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-[#383E39] shrink-0 bg-[#252B27]"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#252B27] border border-[#383E39] flex items-center justify-center text-[#45B58A] shrink-0">
                <Tag className="w-8 h-8" />
              </div>
            )}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30">
                Found Item
              </div>
              <h4 className="text-sm font-bold text-[#F3F4EF] truncate">
                {item.title}
              </h4>
              <p className="text-xs text-[#A9B0AA] line-clamp-2">
                {item.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#A9B0AA] pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#45B58A]" />
                  {item.location?.campusZone || item.campusLocation}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#A9B0AA]" />
                  {new Date(item.dateTime).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Core Ethics Notice */}
          <div className="p-3.5 rounded-2xl bg-[#171A18] border border-[#383E39] text-[#A9B0AA] text-xs flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#45B58A] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#F3F4EF]">Confidential Ownership Proof</span>
              <p className="leading-relaxed text-[11px]">
                Your answers and evidence are <strong>strictly confidential</strong> and visible only to authorized review administrators. Our multimodal AI matching service helps locate candidate pairs, but <strong>never unilaterally confirms ownership</strong>. Physical verification at the designated claim desk is required.
              </p>
            </div>
          </div>

          {/* Success Screen */}
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-[#F3F4EF]">
                Claim Submitted Successfully!
              </h4>
              <p className="text-xs text-[#A9B0AA] max-w-sm mx-auto">
                Review administrators have received your private evidence. You can monitor the review outcome under <strong>My Claims</strong> in the navigation bar.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Secret Answer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#F3F4EF] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#45B58A]" />
                    Secret Verification Answer
                  </label>
                  <span className="text-[10px] text-[#A9B0AA] font-medium">Required</span>
                </div>
                <p className="text-[11px] text-[#A9B0AA] mb-2">
                  Describe confidential details known only to the real owner (e.g., lockscreen wallpaper, passcode hint, engraving, unique scratches, internal contents).
                </p>
                <textarea
                  required
                  rows={3}
                  value={secretAnswer}
                  onChange={(e) => setSecretAnswer(e.target.value)}
                  placeholder="e.g. The wallpaper is a photo of a golden retriever; there is a small blue sticker on the back..."
                  className="w-full p-3 bg-[#171A18] border border-[#383E39] rounded-xl text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                />
              </div>

              {/* Distinguishing Proof */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#F3F4EF] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#45B58A]" />
                    Proof & Ownership Evidence
                  </label>
                  <span className="text-[10px] text-[#A9B0AA] font-medium">Required</span>
                </div>
                <p className="text-[11px] text-[#A9B0AA] mb-2">
                  List any serial numbers, purchase receipt details, dates of purchase, or prior photos you can produce when claiming the item in person.
                </p>
                <textarea
                  required
                  rows={3}
                  value={proofDetails}
                  onChange={(e) => setProofDetails(e.target.value)}
                  placeholder="e.g. Serial #C02D1234MD6R; purchased from campus bookstore on Sept 15 with receipt available..."
                  className="w-full p-3 bg-[#171A18] border border-[#383E39] rounded-xl text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                />
              </div>

              {/* Claimant info preview */}
              <div className="p-3 bg-[#171A18] rounded-xl border border-[#383E39] text-xs text-[#A9B0AA] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#A9B0AA] block">Claimant</span>
                  <span className="font-bold text-[#F3F4EF]">{user?.name}</span> ({user?.studentId || user?.email})
                </div>
                <span className="text-[11px] text-[#45B58A] font-semibold">Logged in Student</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-[#383E39] hover:bg-[#383E39] text-[#A9B0AA] hover:text-[#F3F4EF] font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#171A18]/30 border-t-[#171A18] rounded-full animate-spin" />
                      <span>Submitting Claim...</span>
                    </>
                  ) : (
                    "Submit Ownership Claim"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
