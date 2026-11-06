"use client";

import React, { useState } from "react";
import { Compass, Shield, Heart, Sparkles, X, Lock, FileText, ArrowUpRight } from "lucide-react";

interface FooterProps {
  onOpenProposal?: () => void;
  onOpenWeights?: () => void;
}

export default function Footer({ onOpenProposal, onOpenWeights }: FooterProps) {
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(null);

  return (
    <>
      <footer className="w-full border-t border-[#2C342E] bg-transparent text-[#C4CBC5] pt-16 pb-10 mt-auto relative overflow-hidden">
        {/* Subtle Top Ambient Gradient */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#45B58A]/30 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main 12-Column Balanced Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
            
            {/* Col 1: Branding & Mission (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1C221E] border border-[#313A33] text-[#45B58A] shadow-xs">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[#F3F4EF]">
                  Find<span className="text-[#45B58A]">It</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#1C221E] text-[#C4CBC5] border border-[#313A33]">
                  SYLHET
                </span>
              </div>

              <p className="text-xs text-[#C4CBC5] leading-relaxed max-w-sm">
                An AI-powered lost and found platform for Sylhet City. Smart matching using vision, text, and location.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-[#1C221E] text-[#45B58A] border border-[#313A33]">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#45B58A] animate-pulse" />
                <span>Sylhet Network Active</span>
              </div>
            </div>

            {/* Col 2: Platform Navigation (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F3F4EF]">
                Platform
              </h3>
              <ul className="space-y-2 text-xs text-[#C4CBC5]">
                <li>
                  <a href="#recent-items" className="hover:text-[#F3F4EF] transition flex items-center gap-1 group">
                    <span>Browse Items</span>
                    <ArrowUpRight className="w-3 h-3 text-[#383E39] group-hover:text-[#45B58A] transition" />
                  </a>
                </li>
                <li>
                  <a href="#report-form" className="hover:text-[#F3F4EF] transition flex items-center gap-1 group">
                    <span>Report Lost Item</span>
                    <ArrowUpRight className="w-3 h-3 text-[#383E39] group-hover:text-[#45B58A] transition" />
                  </a>
                </li>
                <li>
                  <a href="#report-form" className="hover:text-[#F3F4EF] transition flex items-center gap-1 group">
                    <span>Report Found Item</span>
                    <ArrowUpRight className="w-3 h-3 text-[#383E39] group-hover:text-[#45B58A] transition" />
                  </a>
                </li>
                <li>
                  <a href="/map" className="hover:text-[#F3F4EF] transition flex items-center gap-1 group">
                    <span>Interactive Map</span>
                    <ArrowUpRight className="w-3 h-3 text-[#383E39] group-hover:text-[#45B58A] transition" />
                  </a>
                </li>
                <li>
                  <a href="/benchmark" className="hover:text-[#45B58A] transition flex items-center gap-1 group">
                    <span className="font-semibold text-[#45B58A]">AI Benchmark (350 Pairs)</span>
                    <ArrowUpRight className="w-3 h-3 text-[#45B58A] transition" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Multimodal AI & Tech (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F3F4EF]">
                AI Technology
              </h3>
              <ul className="space-y-2 text-xs text-[#C4CBC5]">
                <li>
                  <button
                    type="button"
                    onClick={onOpenWeights}
                    className="hover:text-[#F3F4EF] transition text-left cursor-pointer flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#45B58A] group-hover:scale-150 transition" />
                    <span>OpenCLIP Vision (ViT-B/32)</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenWeights}
                    className="hover:text-[#F3F4EF] transition text-left cursor-pointer flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#45B58A] group-hover:scale-150 transition" />
                    <span>S-BERT Semantic Vectors</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenWeights}
                    className="hover:text-[#F3F4EF] transition text-left cursor-pointer flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#45B58A] group-hover:scale-150 transition" />
                    <span>Location &amp; Time Decay Scoring</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenWeights}
                    className="hover:text-[#F3F4EF] transition text-left cursor-pointer flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#45B58A] group-hover:scale-150 transition" />
                    <span>Admin Ownership Verification</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Developer Profile Card (3 cols) */}
            <div className="lg:col-span-3">
              <div className="p-4 rounded-2xl bg-[#1C221E] border border-[#313A33] shadow-lg shadow-black/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#141715] border border-[#313A33] text-[#45B58A] font-bold text-xs flex items-center justify-center">
                    FN
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-semibold text-[#F3F4EF] truncate">
                      Farhana Nowshin
                    </h4>
                    <p className="text-[10px] text-[#45B58A] font-semibold truncate">
                      Full-Stack Developer &bull; CSE, Metropolitan University
                    </p>
                  </div>
                </div>

                {/* GitHub & LinkedIn Action Pills */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <a
                    href="https://github.com/farhananowshin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141715] hover:bg-[#252E27] text-[#F3F4EF] text-xs font-semibold border border-[#313A33] transition group"
                  >
                    <svg
                      className="w-3.5 h-3.5 fill-current text-[#C4CBC5] group-hover:text-white transition shrink-0"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>GitHub</span>
                  </a>

                  <a
                    href="https://www.linkedin.com/in/farhana-nowshin-b36413298/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141715] hover:bg-[#252E27] text-[#F3F4EF] text-xs font-semibold border border-[#313A33] transition group"
                  >
                    <svg
                      className="w-3.5 h-3.5 fill-[#0A66C2] group-hover:opacity-90 transition shrink-0"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                </div>

                {/* Architecture & Specs Action Button inside Card (Refined, Balanced Accent) */}
                {onOpenProposal && (
                  <button
                    type="button"
                    onClick={onOpenProposal}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#45B58A] bg-[#45B58A]/10 hover:bg-[#45B58A] hover:text-[#141715] border border-[#45B58A]/30 transition cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>System Architecture &amp; Specs</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#2C342E] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A2ABA4]">
            <p className="flex items-center gap-1.5">
              &copy; 2026 FindIt Platform &bull; Built with
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-0.5" />
              in Sylhet, Bangladesh.
            </p>

            <div className="flex items-center gap-3.5 text-xs text-[#A2ABA4]">
              <button
                type="button"
                onClick={() => setLegalModal("privacy")}
                className="hover:text-[#F3F4EF] transition cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-[#313A33]">&bull;</span>
              <button
                type="button"
                onClick={() => setLegalModal("terms")}
                className="hover:text-[#F3F4EF] transition cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-[#313A33]">&bull;</span>
              <span className="inline-flex items-center gap-1.5 text-[#45B58A] text-[11px] font-medium bg-[#1C221E] px-2.5 py-0.5 rounded-full border border-[#313A33]">
                <Shield className="w-3 h-3 text-[#45B58A]" />
                Verified Ownership
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Privacy & Terms Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171A18]/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#252B27] text-[#F3F4EF] rounded-3xl shadow-2xl border border-[#383E39] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#383E39] bg-[#171A18]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#45B58A]/10 text-[#45B58A] border border-[#45B58A]/20">
                  {legalModal === "privacy" ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-[#F3F4EF]">
                  {legalModal === "privacy" ? "Privacy & Verification Policy" : "Platform Terms of Service"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="p-1.5 rounded-lg text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#A9B0AA] leading-relaxed">
              {legalModal === "privacy" ? (
                <>
                  <div className="p-3 rounded-xl bg-[#171A18] border border-[#383E39] text-[#F3F4EF] font-medium">
                    🛡️ FindIt uses privacy-preserving ownership verification. Sensitive identifying details are never shown to the public.
                  </div>
                  <h4 className="font-semibold text-[#F3F4EF] text-sm">1. Secret Question &amp; Verification Shield</h4>
                  <p>
                    When a found item is submitted, the unique identifying answers (e.g. serial numbers, wallpaper descriptions, private engraving) are stored securely. Claimants must answer these privately without seeing the answer upfront.
                  </p>
                  <h4 className="font-semibold text-[#F3F4EF] text-sm">2. Contact Information Security</h4>
                  <p>
                    Personal phone numbers and student email addresses are masked by default and only disclosed to authenticated administrators or when a claim has been verified and approved.
                  </p>
                  <h4 className="font-semibold text-[#F3F4EF] text-sm">3. Multimodal Vector Processing</h4>
                  <p>
                    Photographs and item descriptions are transformed into mathematical vector embeddings (512-dim visual, 384-dim textual) for similarity computation. No biometric or user surveillance data is collected.
                  </p>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-[#171A18] border border-[#383E39] text-[#F3F4EF] font-medium">
                    🤝 FindIt operates as a trusted community recovery network for citizens and students across Sylhet.
                  </div>
                  <h4 className="font-semibold text-[#F3F4EF] text-sm">1. Community Good Samaritan Guidelines</h4>
                  <p>
                    All items turned in should be treated with care. When finding valuable electronics, wallets, or government identification, submit a report promptly to facilitate swift return.
                  </p>
                  <h4 className="font-semibold text-[#F3F4EF] text-sm">2. Safe Handover Points in Sylhet</h4>
                  <p>
                    All physical item exchanges should take place at official, well-lit public hubs—such as university proctor offices, library reception desks, or verified transit desks in Zindabazar, Amberkhana, and Shibganj.
                  </p>
                  <h4 className="font-semibold text-[#F3F4EF] text-sm">3. Fraud Prevention</h4>
                  <p>
                    Submitting false claims or pretending to own another student&apos;s lost device is strictly prohibited and subject to account suspension and campus disciplinary referral.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 border-t border-[#383E39] bg-[#171A18] flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-4 py-2 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
