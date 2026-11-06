"use client";

import React from "react";
import {
  X,
  Image as ImageIcon,
  FileText,
  MapPin,
  Clock,
  Tag,
  ShieldAlert,
  Sliders,
} from "lucide-react";

interface WeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeightsModal({ isOpen, onClose }: WeightsModalProps) {
  if (!isOpen) return null;

  const weights = [
    {
      factor: "Visual Similarity (W_img)",
      weight: "0.40 (40%)",
      icon: ImageIcon,
      model: "OpenCLIP ViT-B/32",
      description:
        "Cosine similarity between normalized image embedding vectors of the lost and found items. Evaluates shape, texture, color patterns, and visual appearance.",
      fallback: "When no image is provided, weights dynamically re-normalize to text.",
    },
    {
      factor: "Semantic Description (W_txt)",
      weight: "0.25 (25%)",
      icon: FileText,
      model: "all-MiniLM-L6-v2 (Sentence Transformers)",
      description:
        "Dense semantic vector similarity across titles, descriptions, and distinctive notes. Captures semantic synonyms (e.g. 'rucksack' ≈ 'backpack').",
      fallback: "Always evaluated.",
    },
    {
      factor: "Spatiotemporal Location (W_loc)",
      weight: "0.15 (15%)",
      icon: MapPin,
      model: "Campus Graph & Zone Proximity",
      description:
        "Proximity between the reported lost location and found location. Higher score for exact same building and floor; tiered penalty for neighboring zones.",
      fallback: "Zone-level match score.",
    },
    {
      factor: "Time Proximity (W_time)",
      weight: "0.10 (10%)",
      icon: Clock,
      model: "Exponential Time-Decay Function",
      description:
        "Calculates time interval: |t_found - t_lost|. Items found shortly after being lost score near 1.0; score gradually decays over days.",
      fallback: "Timestamp delta penalty.",
    },
    {
      factor: "Attributes & Brand (W_attr)",
      weight: "0.10 (10%)",
      icon: Tag,
      model: "Exact / Fuzzy Categorical Overlap",
      description:
        "Calculated from category match (must match or score is penalized), brand equality, and primary/secondary color overlap.",
      fallback: "Categorical intersection.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171A18]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#252B27] rounded-3xl shadow-2xl border border-[#383E39] overflow-hidden flex flex-col max-h-[90vh] text-[#F3F4EF]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#383E39] bg-[#1E2320]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#171A18] text-[#45B58A] border border-[#383E39] rounded-2xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F3F4EF]">
                Multimodal AI Weighting Formula
              </h3>
              <p className="text-xs text-[#A9B0AA]">
                Explainable Match Scoring Architecture &bull; Multimodal Cross-Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* Formula Display */}
          <div className="p-4 rounded-2xl bg-[#171A18] border border-[#383E39]">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#45B58A] block mb-1">
              Matching Formulation
            </span>
            <code className="text-sm sm:text-base font-mono block text-[#45B58A]">
              Score = 0.40(S_img) + 0.25(S_txt) + 0.15(S_loc) + 0.10(S_time) + 0.10(S_attr)
            </code>
            <p className="text-xs text-[#A9B0AA] mt-2">
              Sum of weights = 1.00 (100%). Weights combine visual OpenCLIP image embeddings, dense semantic text vectors, spatiotemporal proximity, and attribute classification to maximize match accuracy across Sylhet.
            </p>
          </div>

          {/* Breakdown cards */}
          <div className="space-y-3">
            {weights.map((w, index) => {
              const Icon = w.icon;
              return (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl border border-[#383E39] bg-[#171A18] flex flex-col sm:flex-row sm:items-start gap-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-[200px]">
                    <div className="p-2 rounded-xl bg-[#252B27] border border-[#383E39] text-[#45B58A]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#F3F4EF]">{w.factor}</h4>
                      <span className="inline-block text-xs font-bold text-[#45B58A]">
                        Weight: {w.weight}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 text-xs text-[#A9B0AA]">
                    <p className="leading-relaxed">{w.description}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#A9B0AA] font-mono">
                      <span className="font-semibold text-[#F3F4EF]">Model:</span> {w.model}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ethics / Verification Notice */}
          <div className="p-3.5 rounded-2xl bg-[#171A18] border border-[#383E39] text-[#A9B0AA] flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#45B58A] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-[#F3F4EF]">Human-in-the-Loop Safeguard:</span>
              <p className="mt-0.5 leading-relaxed">
                The AI system ranks candidates and explains why they match. By design, <strong>the AI will NEVER automatically confirm ownership or release an item</strong>. Final release requires manual review by authorized verification administrators.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#383E39] bg-[#1E2320] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#F3F4EF] bg-[#252B27] border border-[#383E39] rounded-xl hover:bg-[#383E39] transition cursor-pointer"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
