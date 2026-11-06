"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Sparkles,
  Tag,
  ImageIcon,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Info,
  Sliders,
} from "lucide-react";
import { StoredItemReport, MatchResponse, MatchCandidate, CAMPUS_LOCATIONS } from "../types/item";
import { fetchMatchesForItem } from "../services/api";

interface MatchesModalProps {
  lostItem: StoredItemReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MatchesModal({ lostItem, isOpen, onClose }: MatchesModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchResponse | null>(null);

  const currentLostItemId = isOpen && lostItem ? (lostItem._id || lostItem.id || null) : null;
  const [prevLostItemId, setPrevLostItemId] = useState<string | null>(null);
  if (currentLostItemId !== prevLostItemId) {
    setPrevLostItemId(currentLostItemId);
    setMatchData(null);
    setError(null);
    setLoading(Boolean(currentLostItemId));
  }

  const loadMatches = useCallback(() => {
    if (!lostItem) return;
    const itemId = lostItem._id || lostItem.id;
    if (!itemId) return;

    setLoading(true);
    setError(null);

    fetchMatchesForItem(itemId)
      .then((data) => {
        setMatchData(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load matches.";
        setError(message);
        setLoading(false);
      });
  }, [lostItem]);

  useEffect(() => {
    if (!isOpen || !lostItem) return;
    const itemId = lostItem._id || lostItem.id;
    if (!itemId) return;

    let isMounted = true;
    fetchMatchesForItem(itemId)
      .then((data) => {
        if (isMounted) {
          setMatchData(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load matches.";
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, lostItem]);

  if (!isOpen || !lostItem) return null;

  const getLocationName = (id: string) => {
    return CAMPUS_LOCATIONS.find((l) => l.id === id)?.name || id;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#45B58A] bg-[#45B58A]/10 border-[#45B58A]/40";
    if (score >= 60) return "text-[#45B58A] bg-[#45B58A]/10 border-[#45B58A]/20";
    return "text-[#A9B0AA] bg-[#252B27] border-[#383E39]";
  };

  const getBarColor = (score: number) => {
    if (score >= 0.7) return "bg-[#45B58A]";
    if (score >= 0.4) return "bg-[#45B58A]/80";
    return "bg-[#383E39]";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#171A18]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#252B27] rounded-3xl shadow-2xl border border-[#383E39] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#383E39] bg-[#171A18]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#45B58A]/10 text-[#45B58A] border border-[#45B58A]/20 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#F3F4EF]">
                  Multimodal AI Match Results
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#45B58A]/10 text-[#45B58A] border border-[#45B58A]/30">
                  Multimodal Matcher
                </span>
              </div>
              <p className="text-xs text-[#A9B0AA]">
                Evaluating candidate Found reports using OpenCLIP (ViT-B/32) &amp; S-BERT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Lost Item Brief Summary */}
        <div className="px-6 py-3 bg-[#171A18]/80 border-b border-[#383E39] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[#F3F4EF] bg-[#383E39] px-2 py-0.5 rounded text-[11px]">
              Target Lost Item
            </span>
            <span className="font-semibold text-[#F3F4EF]">{lostItem.title}</span>
            <span className="text-[#A9B0AA] font-mono">({lostItem._id || lostItem.id})</span>
          </div>
          <div className="flex items-center gap-3 text-[#A9B0AA]">
            <span><strong>Category:</strong> {lostItem.category.replace("_", " ")}</span>
            <span><strong>Location:</strong> {getLocationName(lostItem.campusLocation)}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-6 flex-1 bg-[#252B27]">
          {/* Loading State */}
          {loading && (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-[#45B58A] animate-spin mx-auto" />
              <div>
                <h4 className="text-base font-bold text-[#F3F4EF]">
                  Computing Multimodal AI Similarities...
                </h4>
                <p className="text-xs text-[#A9B0AA] mt-1 max-w-md mx-auto">
                  Generating OpenCLIP visual embeddings (512-dim) and Sentence Transformers semantic vectors (384-dim) for eligible found items.
                </p>
              </div>
            </div>
          )}

          {/* Error State / AI Offline Graceful Degradation */}
          {error && !loading && (
            <div className="p-6 rounded-2xl bg-[#171A18] border border-[#383E39] text-[#A9B0AA] text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#F3F4EF]">
                  <AlertCircle className="w-5 h-5 text-[#45B58A] shrink-0" />
                  <span>Multimodal AI Matching Unavailable</span>
                </div>
                <button
                  type="button"
                  onClick={loadMatches}
                  className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-xs transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry AI Service</span>
                </button>
              </div>

              <p className="leading-relaxed text-[#A9B0AA]">
                {error}
              </p>

              <div className="p-3.5 bg-[#252B27] rounded-xl border border-[#383E39] text-[11px] text-[#A9B0AA] space-y-1">
                <p className="font-semibold text-[#F3F4EF]">
                  Graceful Service Degradation:
                </p>
                <p className="leading-relaxed">
                  Campus item browsing, lost/found reporting, student claims, and administrative review remain 100% operational.
                </p>
              </div>
            </div>
          )}

          {/* Empty Candidates State */}
          {!loading && !error && matchData && matchData.matches.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-[#383E39] rounded-3xl p-8 bg-[#171A18]">
              <Info className="w-10 h-10 text-[#A9B0AA] mx-auto mb-2" />
              <h4 className="text-base font-semibold text-[#F3F4EF]">No Eligible Found Items Yet</h4>
              <p className="text-xs text-[#A9B0AA] mt-1 max-w-sm mx-auto">
                There are currently no active Found reports to match against. Submit a found item report first to test the matching engine!
              </p>
            </div>
          )}

          {/* Ranked Candidates Feed */}
          {!loading && !error && matchData && matchData.matches.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs text-[#A9B0AA] pb-2 border-b border-[#383E39]">
                <span>
                  Evaluated <strong className="text-[#F3F4EF]">{matchData.totalCandidatesEvaluated}</strong> candidate reports in MongoDB. Showing top {matchData.matches.length} matches.
                </span>
                <span className="font-semibold text-[#45B58A]">
                  Ranked by Multimodal Score
                </span>
              </div>

              {matchData.matches.map((match: MatchCandidate, index: number) => {
                const hasImage = match.imageUrls && match.imageUrls.length > 0;
                const isTextOnlyFallback = match.unavailableModalities.includes("visual");

                return (
                  <div
                    key={match.itemId}
                    className="p-5 rounded-2xl border border-[#383E39] bg-[#171A18] space-y-4"
                  >
                    {/* Top Row: Rank, Title, Score */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-[#252B27] border border-[#383E39] text-[#45B58A] font-bold text-xs flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-[#F3F4EF]">
                              {match.title}
                            </h4>
                            <span className="text-xs px-2 py-0.5 rounded bg-[#252B27] text-[#A9B0AA] border border-[#383E39] font-mono">
                              #{match.itemId.slice(-6)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#A9B0AA]">
                            <span className="capitalize text-[#45B58A] bg-[#45B58A]/10 px-2 py-0.5 rounded border border-[#45B58A]/20 font-medium">
                              {match.category.replace("_", " ")}
                            </span>
                            {match.brand && <span>Brand: <strong className="text-[#F3F4EF]">{match.brand}</strong></span>}
                            <span>Zone: <strong className="text-[#F3F4EF]">{match.campusZone || "Campus"}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Total Score Badge */}
                      <div className={`px-4 py-2 rounded-2xl border text-center self-start sm:self-auto ${getScoreColor(match.matchScore)}`}>
                        <span className="text-[10px] uppercase font-bold tracking-wider block">
                          Match Score
                        </span>
                        <span className="text-2xl font-black">
                          {match.matchScore}%
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Photo Preview & 5-Weight Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
                      {/* Image Thumbnail */}
                      <div className="md:col-span-3 h-28 rounded-xl bg-[#252B27] overflow-hidden flex items-center justify-center border border-[#383E39]">
                        {hasImage ? (
                          <img
                            src={match.imageUrls[0]}
                            alt={match.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-3 text-[#A9B0AA]">
                            <ImageIcon className="w-7 h-7 mx-auto mb-1 stroke-1" />
                            <span className="text-[10px] block font-medium">No Photo</span>
                          </div>
                        )}
                      </div>

                      {/* 5-Weight Factors Progress Bars */}
                      <div className="md:col-span-9 space-y-2 text-xs">
                        {/* Visual */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-[#F3F4EF] flex items-center gap-1">
                              Visual (OpenCLIP ViT-B/32)
                              <span className="text-[#A9B0AA] font-normal">
                                [Weight: {(match.effectiveWeights.visual ? match.effectiveWeights.visual * 100 : 0).toFixed(0)}%]
                              </span>
                            </span>
                            <span className="font-bold text-[#45B58A]">
                              {match.scoreBreakdown.visual !== null
                                ? `${(match.scoreBreakdown.visual * 100).toFixed(0)}%`
                                : "Unavailable"}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#252B27] overflow-hidden">
                            <div
                              className={`h-full ${getBarColor(match.scoreBreakdown.visual || 0)}`}
                              style={{ width: `${(match.scoreBreakdown.visual || 0) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Textual */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-[#F3F4EF] flex items-center gap-1">
                              Text Semantic (S-BERT)
                              <span className="text-[#A9B0AA] font-normal">
                                [Weight: {(match.effectiveWeights.textual ? match.effectiveWeights.textual * 100 : 0).toFixed(0)}%]
                              </span>
                            </span>
                            <span className="font-bold text-[#45B58A]">
                              {match.scoreBreakdown.textual !== null
                                ? `${(match.scoreBreakdown.textual * 100).toFixed(0)}%`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#252B27] overflow-hidden">
                            <div
                              className={`h-full ${getBarColor(match.scoreBreakdown.textual || 0)}`}
                              style={{ width: `${(match.scoreBreakdown.textual || 0) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-[#F3F4EF] flex items-center gap-1">
                              Location Proximity
                              <span className="text-[#A9B0AA] font-normal">
                                [Weight: {(match.effectiveWeights.location ? match.effectiveWeights.location * 100 : 0).toFixed(0)}%]
                              </span>
                            </span>
                            <span className="font-bold text-[#45B58A]">
                              {match.scoreBreakdown.location !== null
                                ? `${(match.scoreBreakdown.location * 100).toFixed(0)}%`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#252B27] overflow-hidden">
                            <div
                              className={`h-full ${getBarColor(match.scoreBreakdown.location || 0)}`}
                              style={{ width: `${(match.scoreBreakdown.location || 0) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Time & Attributes in two columns */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-semibold text-[#A9B0AA]">Time Proximity</span>
                              <span className="font-bold text-[#45B58A]">
                                {match.scoreBreakdown.time !== null
                                  ? `${(match.scoreBreakdown.time * 100).toFixed(0)}%`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#252B27] overflow-hidden">
                              <div
                                className={`h-full ${getBarColor(match.scoreBreakdown.time || 0)}`}
                                style={{ width: `${(match.scoreBreakdown.time || 0) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-semibold text-[#A9B0AA]">Attributes Match</span>
                              <span className="font-bold text-[#45B58A]">
                                {match.scoreBreakdown.attribute !== null
                                  ? `${(match.scoreBreakdown.attribute * 100).toFixed(0)}%`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#252B27] overflow-hidden">
                              <div
                                className={`h-full ${getBarColor(match.scoreBreakdown.attribute || 0)}`}
                                style={{ width: `${(match.scoreBreakdown.attribute || 0) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Weight Re-normalization Banner if Visual is missing */}
                    {isTextOnlyFallback && (
                      <div className="p-2.5 rounded-xl bg-[#252B27] border border-[#383E39] text-[11px] text-[#A9B0AA] flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-[#45B58A] shrink-0" />
                        <span>
                          <strong className="text-[#F3F4EF]">Missing Modality Re-normalization:</strong> Since one or both items lacked photos, visual weight was redistributed.
                        </span>
                      </div>
                    )}

                    {/* Natural Language Explanation Box */}
                    <div className="p-4 rounded-xl bg-[#252B27] border border-[#383E39] text-xs text-[#A9B0AA] space-y-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-[#45B58A] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#F3F4EF]">AI Rationale: </span>
                          <span className="leading-relaxed">{match.explanation}</span>
                        </div>
                      </div>

                      {/* Top Shared Keywords / Cues */}
                      {match.topKeywordsShared && match.topKeywordsShared.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-6">
                          <span className="text-[11px] font-semibold text-[#A9B0AA] flex items-center gap-1 mr-1">
                            <Tag className="w-3 h-3 text-[#45B58A]" /> Key Shared Cues:
                          </span>
                          {match.topKeywordsShared.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-[#171A18] text-[#45B58A] border border-[#383E39] text-[10px] font-medium"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Visual & Textual Cues */}
                      {((match.visualCues && match.visualCues.length > 0) || (match.textualCues && match.textualCues.length > 0)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-6 text-[11px]">
                          {match.visualCues && match.visualCues.length > 0 && (
                            <div className="p-2 rounded-lg bg-[#171A18] border border-[#383E39] space-y-1">
                              <span className="font-semibold text-[#F3F4EF] flex items-center gap-1">
                                Visual Evidence
                              </span>
                              <ul className="list-disc list-inside text-[#A9B0AA] space-y-0.5">
                                {match.visualCues.map((vc, i) => (
                                  <li key={i}>{vc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {match.textualCues && match.textualCues.length > 0 && (
                            <div className="p-2 rounded-lg bg-[#171A18] border border-[#383E39] space-y-1">
                              <span className="font-semibold text-[#F3F4EF] flex items-center gap-1">
                                Semantic Text Evidence
                              </span>
                              <ul className="list-disc list-inside text-[#A9B0AA] space-y-0.5">
                                {match.textualCues.map((tc, i) => (
                                  <li key={i}>{tc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin Human Verification Guidance */}
                      {match.humanVerificationGuidance && (
                        <div className="mt-2 pl-6 text-[11px] text-[#A9B0AA] bg-[#171A18] p-2.5 rounded-lg border border-[#383E39] flex items-start gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#45B58A] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#F3F4EF]">Admin Verification Guidance: </span>
                            <span>{match.humanVerificationGuidance}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Strict Human-in-the-Loop Ownership Safeguard */}
          <div className="p-4 rounded-2xl bg-[#171A18] border border-[#383E39] text-[#A9B0AA] text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#45B58A] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#F3F4EF]">Human-in-the-Loop Safeguard:</span>
              <p className="mt-0.5 text-[#A9B0AA] leading-relaxed">
                These scores represent mathematical candidate rankings calculated by OpenCLIP and Sentence Transformers. <strong>The AI system will never automatically confirm ownership.</strong> Final physical handover requires manual verification by campus administration.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#383E39] bg-[#171A18] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-[#F3F4EF] bg-[#252B27] border border-[#383E39] rounded-xl hover:bg-[#383E39] transition cursor-pointer"
          >
            Close Matches
          </button>
        </div>
      </div>
    </div>
  );
}
