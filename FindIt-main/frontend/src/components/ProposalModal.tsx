"use client";

import React from "react";
import {
  X,
  CheckCircle2,
  FileText,
  Sparkles,
  ExternalLink,
  Layers,
} from "lucide-react";

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROPOSAL_FEATURES = [
  {
    num: 1,
    title: "User Authentication & Role Management",
    desc: "Secure user registration, login, logout, and role-based access for Users and Admins with bcrypt password hashing and signed JWT sessions.",
    section: "Module 1: Security & RBAC",
    status: "Completed",
  },
  {
    num: 2,
    title: "Lost & Found Item Reporting",
    desc: "Users can create lost or found reports with item images, descriptions, category, color, date/time, and specific location landmarks.",
    section: "Module 2: Multimodal Ingestion",
    status: "Completed",
  },
  {
    num: 3,
    title: "Item Search & Filtering",
    desc: "Users can search and filter lost and found reports using keywords, categories, dates, locations, and other relevant attributes.",
    section: "Module 3: Fast Query Engine",
    status: "Completed",
  },
  {
    num: 4,
    title: "AI-Powered Multimodal Matching",
    desc: "The system analyzes image (OpenCLIP ViT-B-32), text (Sentence Transformers), location, time, and item attributes to identify and rank potential matches.",
    section: "Module 4: Neural Matching Core",
    status: "Completed",
  },
  {
    num: 5,
    title: "Explainable Match Score",
    desc: "Each potential match includes an explainable match score breakdown across visual, textual, location, time, and attribute factors with natural language rationale.",
    section: "Module 5: Explainability Engine",
    status: "Completed",
  },
  {
    num: 6,
    title: "Automatic Match Notifications",
    desc: "Users receive persistent in-app notifications with badge counters when the AI identifies a high-confidence match (≥ 70%) for their report.",
    section: "Module 6: Alert Dispatcher",
    status: "Completed",
  },
  {
    num: 7,
    title: "Privacy-Preserving Ownership Verification",
    desc: "Claimants submit private item details or secret verification answers without publicly exposing sensitive identifying information to other users.",
    section: "Module 7: Verification Guard",
    status: "Completed",
  },
  {
    num: 8,
    title: "Claim & Recovery Management",
    desc: "Users submit and track ownership claims (/my-claims), while the system manages lifecycle status transitions (pending, approved, rejected, claimed).",
    section: "Module 8: Recovery Lifecycle",
    status: "Completed",
  },
  {
    num: 9,
    title: "Admin Dashboard & Moderation",
    desc: "Administrators manage users and reports, conduct side-by-side ownership cross-examination (/admin), review claims, and resolve recovered items.",
    section: "Module 9: Audit & Governance",
    status: "Completed",
  },
  {
    num: 10,
    title: "Location-Based Map & Item Visualization",
    desc: "Users can toggle an interactive Leaflet/OpenStreetMap view with color-coded pins (Red: Lost, Emerald: Found) and direct matching/claim action shortcuts.",
    section: "Module 10: GeoSpatial Cartography",
    status: "Completed",
  },
];

export default function ProposalModal({ isOpen, onClose }: ProposalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#171A18]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#252B27] rounded-3xl shadow-2xl border border-[#383E39] overflow-hidden flex flex-col max-h-[92vh] text-[#F3F4EF]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#383E39] bg-[#1E2320]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#171A18] text-[#45B58A] border border-[#383E39] rounded-2xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#F3F4EF]">
                  System Architecture &amp; Engineering Matrix
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30">
                  10 / 10 Production Modules Complete
                </span>
              </div>
              <p className="text-xs text-[#A9B0AA]">
                Full-Stack Next.js 16 &bull; Express API &bull; Python FastAPI AI Service &bull; Sylhet, Bangladesh
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

        {/* System Architecture Metadata Card */}
        <div className="px-6 py-4 bg-[#171A18] border-b border-[#383E39]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#45B58A] block">
                Platform Architecture
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-[#F3F4EF]">
                FindIt — Explainable Multimodal Lost &amp; Found Recovery Platform
              </h4>
              <p className="text-xs italic font-semibold text-[#45B58A] mt-0.5">
                &ldquo;Lost it? Find it in Sylhet.&rdquo;
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#A9B0AA] bg-[#252B27] p-3 rounded-2xl border border-[#383E39]">
              <div>
                <span className="text-[10px] text-[#A9B0AA] block font-semibold">Lead Developer</span>
                <strong className="text-[#F3F4EF] text-xs">Farhana Nowshin</strong>
                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                  <a
                    href="https://github.com/farhananowshin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#45B58A] hover:underline font-semibold flex items-center gap-0.5"
                  >
                    GitHub
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <span className="text-[#383E39]">&bull;</span>
                  <a
                    href="https://www.linkedin.com/in/farhana-nowshin-b36413298/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#45B58A] hover:underline font-semibold flex items-center gap-0.5"
                  >
                    LinkedIn
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
              <div className="h-8 w-px bg-[#383E39] hidden sm:block" />
              <div>
                <span className="text-[10px] text-[#A9B0AA] block font-semibold">Core Tech Stack</span>
                <span className="text-[#F3F4EF] font-medium">Next.js 16 &bull; FastAPI &bull; OpenCLIP</span>
                <br />
                <span className="text-[#A9B0AA] text-[11px]">S-BERT &bull; MongoDB &bull; Tailwind CSS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between text-xs text-[#A9B0AA] pb-2 border-b border-[#383E39]">
            <span className="font-semibold text-[#F3F4EF] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#45B58A]" />
              Technical Module Breakdown &amp; Deliverables
            </span>
            <span className="text-[#45B58A] font-bold bg-[#45B58A]/15 px-2 py-0.5 rounded-md border border-[#45B58A]/30">
              100% Implemented &amp; Tested
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {PROPOSAL_FEATURES.map((feat) => (
              <div
                key={feat.num}
                className="p-4 rounded-2xl border border-[#383E39] bg-[#171A18] hover:border-[#45B58A]/50 transition space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#252B27] border border-[#383E39] text-[#45B58A] font-extrabold text-xs flex items-center justify-center shrink-0">
                        {feat.num}
                      </span>
                      <h5 className="text-xs font-bold text-[#F3F4EF] leading-snug">
                        {feat.title}
                      </h5>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-[#45B58A]" />
                      {feat.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#A9B0AA] leading-relaxed pl-8">
                    {feat.desc}
                  </p>
                </div>
                <div className="pt-2 pl-8 border-t border-[#383E39] flex items-center justify-between text-[10px] text-[#A9B0AA]">
                  <span>{feat.section}</span>
                  <span className="text-[#45B58A] font-semibold">Verified Live</span>
                </div>
              </div>
            ))}
          </div>

          {/* Multimodal Formula Box (Section 7) */}
          <div className="p-4 rounded-2xl bg-[#171A18] border border-[#383E39] space-y-2">
            <span className="text-xs font-bold text-[#F3F4EF] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#45B58A]" />
              Proposal Section 7: Multimodal Weighted Formula
            </span>
            <div className="bg-[#252B27] p-3 rounded-xl border border-[#383E39] font-mono text-xs text-[#45B58A] text-center font-bold">
              Match Score = w₁·S_image + w₂·S_text + w₃·S_location + w₄·S_time + w₅·S_attributes
            </div>
            <p className="text-xs text-[#A9B0AA] leading-relaxed">
              Weights (initially 0.40, 0.25, 0.15, 0.10, 0.10) sum to 1.0. Evaluated against 350 benchmark item pairs with empirical Information Retrieval metrics (P@k, R@k, MRR = 1.0000).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#383E39] bg-[#1E2320] flex items-center justify-between">
          <span className="text-xs text-[#A9B0AA]">
            CSE 300 Project Proposal &bull; Metropolitan University
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-[#F3F4EF] bg-[#252B27] border border-[#383E39] rounded-xl hover:bg-[#383E39] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
