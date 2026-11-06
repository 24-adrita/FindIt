"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  KeyRound,
  User,
  MapPin,
  Calendar,
  RefreshCw,
  Search,
  ArrowLeft,
  AlertTriangle,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminClaims, updateClaimStatus, fetchClaimAiExplanation, ClaimAiExplanationResponse } from "../../services/api";
import { Claim, StoredItemReport, UserProfile, CAMPUS_LOCATIONS } from "../../types/item";

export default function AdminDashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isFetchingClaims, setIsFetchingClaims] = useState(false);
  const isLoading = authLoading || isFetchingClaims;
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Action states
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Auth modal state for login fallback
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Per-claim AI Match Explanation state
  const [aiExplanations, setAiExplanations] = useState<{ [claimId: string]: ClaimAiExplanationResponse | null }>({});
  const [loadingAi, setLoadingAi] = useState<{ [claimId: string]: boolean }>({});
  const [expandedAi, setExpandedAi] = useState<{ [claimId: string]: boolean }>({});

  const toggleAiExplanation = async (claimId: string) => {
    if (expandedAi[claimId]) {
      setExpandedAi((prev) => ({ ...prev, [claimId]: false }));
      return;
    }
    setExpandedAi((prev) => ({ ...prev, [claimId]: true }));
    if (aiExplanations[claimId] || !token) return;

    setLoadingAi((prev) => ({ ...prev, [claimId]: true }));
    try {
      const data = await fetchClaimAiExplanation(claimId, token);
      setAiExplanations((prev) => ({ ...prev, [claimId]: data }));
    } catch (err: unknown) {
      console.warn("AI explanation fetch fallback:", err);
    } finally {
      setLoadingAi((prev) => ({ ...prev, [claimId]: false }));
    }
  };

  const loadClaims = useCallback(async () => {
    if (!token || user?.role !== "admin") return;

    setIsFetchingClaims(true);
    setError(null);
    try {
      const result = await fetchAdminClaims(
        token,
        statusFilter === "all" ? undefined : statusFilter
      );
      setClaims(result.data || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load administrative claim records.";
      setError(message);
    } finally {
      setIsFetchingClaims(false);
    }
  }, [token, user, statusFilter]);

  useEffect(() => {
    let isMounted = true;
    if (!authLoading && token && user?.role === "admin") {
      fetchAdminClaims(token, statusFilter === "all" ? undefined : statusFilter)
        .then((result) => {
          if (isMounted) {
            setClaims(result.data || []);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            const message =
              err instanceof Error
                ? err.message
                : "Failed to load administrative claim records.";
            setError(message);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [authLoading, token, user, statusFilter]);

  const getLocationName = (locId: string) => {
    return CAMPUS_LOCATIONS.find((l) => l.id === locId)?.name || locId;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const openActionModal = (claim: Claim, type: "approve" | "reject") => {
    setSelectedClaim(claim);
    setActionType(type);
    setActionNotes(
      type === "approve"
        ? "Verified ownership with secret verification detail and claimant evidence. Ready for pickup at Campus Security Lost & Found."
        : "Secret verification details and proof provided do not correspond with the recovered item."
    );
    setActionError(null);
  };

  const closeActionModal = () => {
    setSelectedClaim(null);
    setActionType(null);
    setActionNotes("");
    setActionError(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedClaim || !actionType || !token) return;

    setIsSubmittingAction(true);
    setActionError(null);

    const claimId = selectedClaim._id || (selectedClaim as unknown as { id: string }).id;

    try {
      await updateClaimStatus(
        claimId,
        actionType === "approve" ? "approved" : "rejected",
        actionNotes.trim(),
        token
      );

      setSuccessBanner(
        actionType === "approve"
          ? `Claim #${claimId.slice(-6)} successfully APPROVED! The item status has been updated to claimed.`
          : `Claim #${claimId.slice(-6)} was REJECTED.`
      );

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessBanner(null), 5000);

      closeActionModal();
      loadClaims();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update claim status.";
      setActionError(message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Filtered by search query
  const filteredClaims = claims.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const claimant = typeof c.claimantId === "object" ? c.claimantId : null;
    const item = typeof c.itemId === "object" ? (c.itemId as StoredItemReport) : null;

    const claimantName = claimant?.name?.toLowerCase() || "";
    const claimantEmail = claimant?.email?.toLowerCase() || "";
    const claimantIdNum = claimant?.studentId?.toLowerCase() || "";
    const itemTitle = item?.title?.toLowerCase() || "";
    const claimNotes = c.proofDetails?.toLowerCase() || "";

    return (
      claimantName.includes(query) ||
      claimantEmail.includes(query) ||
      claimantIdNum.includes(query) ||
      itemTitle.includes(query) ||
      claimNotes.includes(query)
    );
  });

  const pendingCount = claims.filter((c) => c.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#171A18] text-[#F3F4EF]">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#A9B0AA] hover:text-[#45B58A] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campus Feed
          </Link>

          {user?.role === "admin" && (
            <button
              onClick={loadClaims}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#383E39] bg-[#252B27] hover:bg-[#383E39] text-xs font-semibold text-[#F3F4EF] transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#45B58A] ${isLoading ? "animate-spin" : ""}`} />
              Refresh Claims
            </button>
          )}
        </div>

        {/* Dashboard Title & Safety Banner */}
        <div className="bg-[#252B27] rounded-3xl border border-[#383E39] p-6 sm:p-8 shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#171A18] text-[#45B58A] border border-[#383E39] rounded-2xl shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3F4EF] tracking-tight">
                    Admin Ownership Verification Portal
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30">
                    Staff Only
                  </span>
                </div>
                <p className="text-sm text-[#A9B0AA] mt-1 max-w-2xl">
                  Inspect confidential verification answers, cross-examine claimant proof against finder records, and authorize property release.
                </p>
              </div>
            </div>

            {/* Human-in-the-Loop Policy Reminder */}
            <div className="bg-[#171A18] border border-[#383E39] rounded-2xl p-4 text-xs text-[#A9B0AA] max-w-md">
              <div className="flex items-center gap-2 font-bold mb-1 text-[#F3F4EF]">
                <ShieldAlert className="w-4 h-4 text-[#45B58A] shrink-0" />
                <span>Human-in-the-Loop Safety Gate</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Multimodal AI computes similarity scores for candidate matching only. <strong>The AI engine never automatically confirms ownership or releases items.</strong> Every claim requires an authorized campus administrator to review and verify proof.
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-[#171A18] border border-[#45B58A]/40 text-[#45B58A] text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#45B58A] shrink-0" />
              <span className="font-semibold">{successBanner}</span>
            </div>
            <button
              onClick={() => setSuccessBanner(null)}
              className="p-1 text-[#A9B0AA] hover:text-[#F3F4EF] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Authentication Gate Check */}
        {authLoading ? (
          <div className="bg-[#252B27] rounded-3xl border border-[#383E39] p-12 text-center text-[#F3F4EF]">
            <RefreshCw className="w-8 h-8 animate-spin text-[#45B58A] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#A9B0AA]">Verifying administrative access permissions...</p>
          </div>
        ) : !user ? (
          <div className="bg-[#252B27] rounded-3xl border border-[#383E39] p-10 text-center shadow-xl text-[#F3F4EF]">
            <div className="w-14 h-14 bg-[#171A18] text-[#45B58A] border border-[#383E39] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#F3F4EF] mb-2">Administrator Sign-In Required</h2>
            <p className="text-sm text-[#A9B0AA] max-w-md mx-auto mb-6">
              You must be logged in with a campus administrator account to access the ownership claim review queue.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-sm shadow-sm transition"
            >
              <Lock className="w-4 h-4" />
              Sign In to Administrator Console
            </button>
          </div>
        ) : user.role !== "admin" ? (
          <div className="bg-[#252B27] rounded-3xl border border-rose-900/60 p-10 text-center shadow-xl text-[#F3F4EF]">
            <div className="w-14 h-14 bg-rose-950/40 text-rose-400 border border-rose-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#F3F4EF] mb-2">Access Denied: Administrator Privileges Required</h2>
            <p className="text-sm text-[#A9B0AA] max-w-md mx-auto mb-6">
              Your account (<strong>{user.email}</strong>) has the <strong>student</strong> role. Ownership verification and administrative claim inspection are restricted to authorized university staff.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#171A18] border border-[#383E39] hover:bg-[#383E39] text-[#F3F4EF] font-bold text-sm shadow-sm transition"
            >
              Return to Campus Home
            </Link>
          </div>
        ) : (
          /* Admin Console Main View */
          <div>
            {/* Filter & Search Bar */}
            <div className="bg-[#252B27] rounded-2xl border border-[#383E39] p-4 mb-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition flex items-center gap-1.5 shrink-0 ${
                      statusFilter === tab
                        ? "bg-[#45B58A] text-[#171A18] shadow-sm font-bold"
                        : "text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39]"
                    }`}
                  >
                    <span>{tab} Claims</span>
                    {tab === "pending" && pendingCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          statusFilter === tab
                            ? "bg-[#171A18] text-[#45B58A]"
                            : "bg-[#171A18] text-[#A9B0AA] border border-[#383E39]"
                        }`}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search Claimant / Item */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-[#A9B0AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by student, email, item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#383E39] text-xs bg-[#171A18] text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                />
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error loading claims:</span>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Claims Queue */}
            {isLoading ? (
              <div className="bg-[#252B27] rounded-3xl border border-[#383E39] p-12 text-center text-[#F3F4EF]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#45B58A] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#A9B0AA]">Loading claims for review...</p>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="bg-[#252B27] rounded-3xl border border-[#383E39] p-12 text-center shadow-xl text-[#F3F4EF]">
                <CheckCircle2 className="w-12 h-12 text-[#45B58A] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#F3F4EF] mb-1">Queue is Clear</h3>
                <p className="text-sm text-[#A9B0AA] max-w-sm mx-auto">
                  {statusFilter === "pending"
                    ? "There are currently no pending ownership claims awaiting review."
                    : `No ${statusFilter} claims found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredClaims.map((claim) => {
                  const claimId = claim._id || (claim as unknown as { id: string }).id;
                  const item =
                    typeof claim.itemId === "object" && claim.itemId
                      ? (claim.itemId as StoredItemReport)
                      : null;
                  const claimant =
                    typeof claim.claimantId === "object" && claim.claimantId
                      ? (claim.claimantId as UserProfile)
                      : null;

                  return (
                    <div
                      key={claimId}
                      className="bg-[#252B27] rounded-3xl border border-[#383E39] shadow-xl overflow-hidden text-[#F3F4EF]"
                    >
                      {/* Claim Header Bar */}
                      <div className="px-6 py-3.5 bg-[#1E2320] border-b border-[#383E39] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                              claim.status === "approved"
                                ? "bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30"
                                : claim.status === "rejected"
                                ? "bg-rose-950/40 text-rose-300 border border-rose-800/40"
                                : "bg-[#171A18] text-[#F3F4EF] border border-[#383E39]"
                            }`}
                          >
                            {claim.status === "approved" ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : claim.status === "rejected" ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-[#45B58A]" />
                            )}
                            {claim.status}
                          </span>

                          <span className="text-xs text-[#A9B0AA] font-mono">
                            Claim #{claimId.slice(-8)}
                          </span>
                        </div>

                        <div className="text-xs text-[#A9B0AA]">
                          Submitted: {formatDate(claim.createdAt)}
                        </div>
                      </div>

                      {/* Claim Content Grid */}
                      <div className="p-6 space-y-6">
                        {/* Upper Grid: Claimant Profile & Item Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Claimant Profile */}
                          <div className="p-4 rounded-2xl bg-[#171A18] border border-[#383E39]">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9B0AA] block mb-2">
                              Claimant Profile
                            </span>
                            {claimant ? (
                              <div className="space-y-1.5 text-xs text-[#A9B0AA]">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-[#45B58A]" />
                                  <strong className="text-sm text-[#F3F4EF]">{claimant.name}</strong>
                                </div>
                                <div className="pl-6 space-y-0.5">
                                  <div>Email: <span className="font-medium text-[#F3F4EF]">{claimant.email}</span></div>
                                  {claimant.studentId && (
                                    <div>Student ID: <span className="font-medium text-[#F3F4EF]">{claimant.studentId}</span></div>
                                  )}
                                  {claimant.phone && (
                                    <div>Phone: <span className="font-medium text-[#F3F4EF]">{claimant.phone}</span></div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-[#A9B0AA] italic">User #{String(claim.claimantId)}</div>
                            )}
                          </div>

                          {/* Item Under Claim */}
                          <div className="p-4 rounded-2xl bg-[#171A18] border border-[#383E39]">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9B0AA] block mb-2">
                              Recovered Item
                            </span>
                            {item ? (
                              <div className="space-y-1.5 text-xs text-[#A9B0AA]">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-[#F3F4EF]">{item.title}</h4>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#252B27] border border-[#383E39] text-[#A9B0AA]">
                                    {item.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[#A9B0AA]">
                                  <MapPin className="w-3.5 h-3.5 text-[#45B58A]" />
                                  <span>{getLocationName(item.campusLocation)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#A9B0AA]">
                                  <Calendar className="w-3.5 h-3.5 text-[#A9B0AA]" />
                                  <span>{formatDate(item.dateTime)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-[#A9B0AA] italic">Item Report #{String(claim.itemId)}</div>
                            )}
                          </div>
                        </div>

                        {/* Cross-Examination: Side-by-Side Proof Comparison */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <KeyRound className="w-4 h-4 text-[#45B58A]" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F3F4EF]">
                              Side-by-Side Ownership Verification Cross-Examination
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: Finder's Confidential Record */}
                            <div className="rounded-2xl border border-[#45B58A]/50 bg-[#171A18] p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#45B58A] flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5 text-[#45B58A]" />
                                  Finder&apos;s Secret Verification Detail
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30">
                                  Intake Ground Truth
                                </span>
                              </div>
                              <p className="text-xs text-[#F3F4EF] bg-[#252B27] p-3 rounded-xl border border-[#383E39] leading-relaxed font-mono">
                                {item?.secretVerificationDetail || (
                                  <span className="italic text-[#A9B0AA]">
                                    No secret detail was recorded at intake. Review physical proof below.
                                  </span>
                                )}
                              </p>
                              <span className="text-[10px] text-[#A9B0AA] block">
                                Confidential: Hidden from public feed. Visible only to authorized administrators.
                              </span>
                            </div>

                            {/* Right: Claimant's Secret Answer */}
                            <div className="rounded-2xl border border-[#383E39] bg-[#171A18] p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#F3F4EF] flex items-center gap-1.5">
                                  <KeyRound className="w-3.5 h-3.5 text-[#45B58A]" />
                                  Claimant&apos;s Submitted Secret Answer
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#252B27] text-[#A9B0AA] border border-[#383E39]">
                                  Claim Evidence
                                </span>
                              </div>
                              <p className="text-xs text-[#F3F4EF] bg-[#252B27] p-3 rounded-xl border border-[#383E39] leading-relaxed font-mono font-medium">
                                {claim.secretVerificationAnswer}
                              </p>
                              <span className="text-[10px] text-[#A9B0AA] block">
                                Answer submitted by claimant when initiating the ownership request.
                              </span>
                            </div>
                          </div>

                          {/* Full Claimant Proof Details */}
                          <div className="mt-4 p-4 rounded-2xl bg-[#171A18] border border-[#383E39] space-y-1.5">
                            <span className="text-xs font-bold text-[#F3F4EF] block">
                              Claimant&apos;s Unique Marks &amp; Physical Proof Description:
                            </span>
                            <p className="text-xs text-[#A9B0AA] leading-relaxed whitespace-pre-wrap bg-[#252B27] p-3 rounded-xl border border-[#383E39]">
                              {claim.proofDetails}
                            </p>
                          </div>

                          {/* Multimodal AI Match Evidence & Explainability Panel (Task 4) */}
                          <div className="mt-4 p-4 rounded-2xl bg-[#171A18] border border-[#383E39]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#45B58A]" />
                                <span className="text-xs font-bold text-[#F3F4EF] uppercase tracking-wider">
                                  Multimodal AI Match Explanation &amp; Sub-Scores
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30">
                                  FastAPI Neural Matcher
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleAiExplanation(claimId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#252B27] hover:bg-[#383E39] text-[#45B58A] border border-[#383E39] transition cursor-pointer"
                              >
                                {loadingAi[claimId] ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : expandedAi[claimId] ? (
                                  <>
                                    <span>Collapse AI Evidence</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Inspect AI Sub-Scores &amp; Cues</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Collapsed Brief summary or Expanded Full Details */}
                            {expandedAi[claimId] && (
                              <div className="mt-4 pt-4 border-t border-[#383E39] space-y-4 animate-in fade-in duration-150">
                                {loadingAi[claimId] ? (
                                  <div className="py-6 text-center text-xs text-[#A9B0AA] flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin text-[#45B58A]" />
                                    <span>Querying FastAPI AI Microservice for OpenCLIP &amp; S-BERT Sub-Scores...</span>
                                  </div>
                                ) : aiExplanations[claimId] ? (
                                  (() => {
                                    const ai = aiExplanations[claimId]!;
                                    return (
                                      <div className="space-y-4">
                                        {/* Score header */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#252B27] rounded-xl border border-[#383E39]">
                                          <div>
                                            <div className="text-xs text-[#A9B0AA]">Combined Multimodal Match Confidence:</div>
                                            <div className="text-lg font-black text-[#F3F4EF] flex items-center gap-2">
                                              <span>{ai.matchScore}%</span>
                                              <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                  ai.matchScore >= 80
                                                    ? "bg-[#45B58A]/20 text-[#45B58A] border border-[#45B58A]/40"
                                                    : ai.matchScore >= 60
                                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                                    : "bg-[#383E39] text-[#A9B0AA]"
                                                }`}
                                              >
                                                {ai.matchScore >= 80
                                                  ? "High Confidence Match"
                                                  : ai.matchScore >= 60
                                                  ? "Moderate Match"
                                                  : "Advisory Review"}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-right text-[11px] text-[#A9B0AA] max-w-xs leading-relaxed">
                                            {ai.explanation}
                                          </div>
                                        </div>

                                        {/* 5-Factor Sub-Scores Progress Bars */}
                                        <div>
                                          <span className="text-[11px] font-bold text-[#A9B0AA] uppercase tracking-wider block mb-2">
                                            Explainable Factor Sub-Scores Breakdown
                                          </span>
                                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                            {[
                                              { label: "Visual (CLIP)", key: "visual", weight: ai.effectiveWeights.visual || 0.40, score: ai.subScores.visual, unit: "ViT-B/32" },
                                              { label: "Text (S-BERT)", key: "textual", weight: ai.effectiveWeights.textual || 0.25, score: ai.subScores.textual, unit: "MiniLM-L6" },
                                              { label: "Location", key: "location", weight: ai.effectiveWeights.location || 0.15, score: ai.subScores.location, unit: "Zone Match" },
                                              { label: "Time Gap", key: "time", weight: ai.effectiveWeights.time || 0.10, score: ai.subScores.time, unit: "Decay Prox." },
                                              { label: "Attributes", key: "attribute", weight: ai.effectiveWeights.attribute || 0.10, score: ai.subScores.attribute, unit: "Brand & Color" },
                                            ].map((f) => (
                                              <div key={f.key} className="p-2.5 rounded-xl bg-[#252B27] border border-[#383E39] space-y-1">
                                                <div className="flex items-center justify-between text-[11px]">
                                                  <span className="font-semibold text-[#F3F4EF]">{f.label}</span>
                                                  <span className="text-[#45B58A] font-bold font-mono">
                                                    {f.score !== null ? `${f.score}%` : "N/A"}
                                                  </span>
                                                </div>
                                                <div className="w-full bg-[#171A18] h-1.5 rounded-full overflow-hidden">
                                                  <div
                                                    className="h-full bg-[#45B58A] transition-all"
                                                    style={{ width: `${f.score || 0}%` }}
                                                  />
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] text-[#A9B0AA]">
                                                  <span>Weight: {Math.round(f.weight * 100)}%</span>
                                                  <span>{f.unit}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Visual and Textual Cues surfaced by FastAPI */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                          <div className="p-3 bg-[#252B27] rounded-xl border border-[#383E39] space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#45B58A] block">
                                              Top Visual Cues (OpenCLIP)
                                            </span>
                                            {ai.visualCues && ai.visualCues.length > 0 ? (
                                              <ul className="space-y-0.5 text-[11px] text-[#F3F4EF] list-disc list-inside">
                                                {ai.visualCues.map((c, idx) => (
                                                  <li key={idx}>{c}</li>
                                                ))}
                                              </ul>
                                            ) : (
                                              <span className="text-[11px] text-[#A9B0AA] italic">No visual cues available.</span>
                                            )}
                                          </div>

                                          <div className="p-3 bg-[#252B27] rounded-xl border border-[#383E39] space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#45B58A] block">
                                              Top Textual &amp; Context Cues (S-BERT)
                                            </span>
                                            {ai.textualCues && ai.textualCues.length > 0 ? (
                                              <ul className="space-y-0.5 text-[11px] text-[#F3F4EF] list-disc list-inside">
                                                {ai.textualCues.map((c, idx) => (
                                                  <li key={idx}>{c}</li>
                                                ))}
                                              </ul>
                                            ) : (
                                              <span className="text-[11px] text-[#A9B0AA] italic">No textual cues available.</span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Safety Guidance */}
                                        <div className="p-2.5 rounded-xl bg-[#252B27]/60 border border-[#383E39] text-[10px] text-[#A9B0AA] flex items-center gap-2">
                                          <ShieldAlert className="w-3.5 h-3.5 text-[#45B58A] shrink-0" />
                                          <span>{ai.humanVerificationGuidance}</span>
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="py-3 text-center text-xs text-[#A9B0AA]">
                                    Could not retrieve AI explanation. AI Service may be starting up.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Admin Decision Bar */}
                        <div className="pt-4 border-t border-[#383E39]">
                          {claim.status === "pending" ? (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#171A18] p-4 rounded-2xl border border-[#383E39]">
                              <div className="text-xs text-[#A9B0AA]">
                                <strong className="text-[#F3F4EF] block mb-0.5">Decision Required</strong>
                                <span>Compare the intake record against the claimant proof to verify ownership.</span>
                              </div>

                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() => openActionModal(claim, "reject")}
                                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#383E39] bg-[#252B27] hover:bg-rose-950/30 text-rose-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
                                >
                                  <X className="w-4 h-4 text-rose-400" />
                                  Reject Claim
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openActionModal(claim, "approve")}
                                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                                >
                                  <Check className="w-4 h-4 text-[#171A18]" />
                                  Approve Ownership
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Already Reviewed */
                            <div
                              className={`p-4 rounded-2xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#171A18] border ${
                                claim.status === "approved"
                                  ? "border-[#45B58A]/40 text-[#45B58A]"
                                  : "border-rose-900/40 text-rose-300"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                  {claim.status === "approved" ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#45B58A]" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                  )}
                                  <span>
                                    Resolved as {claim.status.toUpperCase()} by Campus Staff
                                  </span>
                                </div>
                                {claim.reviewNotes && (
                                  <p className="italic text-[#A9B0AA] pl-5">
                                    Notes: &ldquo;{claim.reviewNotes}&rdquo;
                                  </p>
                                )}
                              </div>

                              <div className="text-[11px] text-[#A9B0AA] shrink-0">
                                Reviewed on {formatDate(claim.reviewedAt)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation & Review Notes Modal */}
      {selectedClaim && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171A18]/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#252B27] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#383E39] space-y-4 animate-in zoom-in-95 text-[#F3F4EF]">
            <div className="flex items-center justify-between pb-3 border-b border-[#383E39]">
              <div className="flex items-center gap-2">
                {actionType === "approve" ? (
                  <div className="p-2 bg-[#171A18] text-[#45B58A] border border-[#383E39] rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 bg-rose-950/40 text-rose-400 border border-rose-800/40 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-[#F3F4EF]">
                  {actionType === "approve" ? "Approve Ownership Claim" : "Reject Ownership Claim"}
                </h3>
              </div>
              <button
                onClick={closeActionModal}
                className="p-1 rounded-lg text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <p className="text-xs text-[#A9B0AA] leading-relaxed">
              {actionType === "approve" ? (
                <>
                  Approving this claim verifies that the claimant is the legitimate owner. The item status will automatically update to <strong>claimed</strong>, and any conflicting claims for this item will be safely rejected.
                </>
              ) : (
                <>
                  Rejecting this claim will keep the item in the active database so other potential claimants can submit verification proof.
                </>
              )}
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#A9B0AA] uppercase tracking-wider mb-1.5">
                Staff Review Notes &amp; Instructions <span className="text-[#45B58A]">*</span>
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter pickup details, desk hours, or rejection reason..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#383E39] bg-[#171A18] text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] leading-relaxed"
              />
              <span className="text-[10px] text-[#A9B0AA] block mt-1">
                These notes will be visible to the student in their &ldquo;My Claims&rdquo; dashboard.
              </span>
            </div>

            <div className="pt-3 border-t border-[#383E39] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={isSubmittingAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSubmittingAction || !actionNotes.trim()}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 ${
                  actionType === "approve"
                    ? "bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] shadow-md"
                    : "bg-rose-700 hover:bg-rose-800 text-white shadow-sm"
                }`}
              >
                {isSubmittingAction ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : actionType === "approve" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Approval</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Quick Login */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab="login"
      />

      <Footer />
    </div>
  );
}
