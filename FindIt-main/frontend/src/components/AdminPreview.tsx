"use client";

import React from "react";
import {
  Lock,
  Cpu,
  UserCheck,
} from "lucide-react";

import Link from "next/link";

export default function AdminPreview() {
  return (
    <section id="admin-preview" className="w-full max-w-6xl mx-auto pt-2 pb-6 px-4 sm:px-6">
      <div className="rounded-3xl bg-[#252B27] text-[#F3F4EF] p-8 sm:p-12 border border-[#383E39] shadow-2xl relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#45B58A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#171A18] text-[#45B58A] border border-[#383E39] mb-4">
            <Lock className="w-3.5 h-3.5 text-[#45B58A]" />
            Security &amp; Governance Architecture
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F3F4EF]">
                Explainable AI with <span className="text-[#45B58A]">Strict Human Oversight</span>
              </h2>
              <p className="text-sm sm:text-base text-[#A9B0AA] leading-relaxed">
                In real-world deployment, automated item release carries significant risk of fraudulent claims. In FindIt, our multimodal AI calculates similarity scores and produces granular explanations, but <strong>never unilaterally confirms ownership</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#171A18] border border-[#383E39]">
                  <div className="flex items-center gap-2 text-[#45B58A] font-bold text-sm mb-1">
                    <Cpu className="w-4 h-4" />
                    Multimodal AI Agent
                  </div>
                  <p className="text-xs text-[#A9B0AA] leading-relaxed">
                    Computes OpenCLIP visual vectors, Sentence Transformer text similarity, location graph proximity, and time decay to rank candidate pairs.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#171A18] border border-[#383E39]">
                  <div className="flex items-center gap-2 text-[#45B58A] font-bold text-sm mb-1">
                    <UserCheck className="w-4 h-4" />
                    Admin Hand-off Verifier
                  </div>
                  <p className="text-xs text-[#A9B0AA] leading-relaxed">
                    Inspects secret verification questions, serial numbers, NID/Student credentials, and authorizes physical release from the verification desk.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-xs shadow-md transition transform hover:-translate-y-0.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Open Live Admin Verification Portal &rarr;
                </Link>
              </div>
            </div>

            {/* Workflow preview diagram card */}
            <div className="lg:col-span-5 bg-[#171A18] rounded-2xl p-5 border border-[#383E39]">
              <span className="text-xs font-mono uppercase text-[#A9B0AA] block mb-3 font-semibold">
                Explainable AI Verification Workflow
              </span>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#252B27] border border-[#383E39]">
                  <span className="w-5 h-5 rounded-full bg-[#171A18] text-[#45B58A] border border-[#383E39] flex items-center justify-center font-bold text-[11px] shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-[#F3F4EF]">Multimodal Intake</span>
                    <p className="text-[#A9B0AA] text-[11px]">User reports lost/found item with photos &amp; details across Sylhet hubs.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#252B27] border border-[#383E39]">
                  <span className="w-5 h-5 rounded-full bg-[#171A18] text-[#45B58A] border border-[#383E39] flex items-center justify-center font-bold text-[11px] shrink-0">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-[#F3F4EF]">5-Weight Fusion Scoring</span>
                    <p className="text-[#A9B0AA] text-[11px]">0.40(Img) + 0.25(Txt) + 0.15(Loc) + 0.10(Time) + 0.10(Attr).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#252B27] border border-[#383E39]">
                  <span className="w-5 h-5 rounded-full bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30 flex items-center justify-center font-bold text-[11px] shrink-0">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-[#45B58A]">Admin Gatekeeper Verification</span>
                    <p className="text-[#A9B0AA] text-[11px]">Administrator compares secret attributes and authenticates owner before handover.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
