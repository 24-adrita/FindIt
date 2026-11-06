"use client";

import React, { useState } from "react";
import {
  X,
  Camera,
  Sparkles,
  ShieldCheck,
  MapPin,
  Lock,
  ArrowRight,
} from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReport?: (type: "lost" | "found") => void;
  onBrowseFeed?: () => void;
}

export default function HowItWorksModal({
  isOpen,
  onClose,
  onBrowseFeed,
}: HowItWorksModalProps) {
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 0,
      tab: "1. Snap & Post",
      title: "Take a photo & tag your location",
      description:
        "Lost or found something in Sylhet? Snap a picture, select the landmark, and publish in 30 seconds.",
      // Clean, daylight visual card
      visual: (
        <div className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-sky-500" />
              New Report
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
              Lost Item
            </span>
          </div>

          <div className="flex items-center gap-3">
            <img
              src="/images/sylhet_cng_wallet.jpg"
              alt="Wallet"
              className="w-14 h-14 rounded-xl object-cover border border-slate-100 shadow-xs shrink-0"
            />
            <div className="overflow-hidden space-y-0.5 text-left">
              <p className="text-xs font-bold text-slate-900 truncate">Black Leather Wallet</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                Amberkhana CNG Stand
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold">Active &bull; Sylhet Network</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      tab: "2. AI Match",
      title: "AI scans & connects the reports",
      description:
        "Our OpenCLIP vision and text matching algorithms automatically detect when lost and found reports match.",
      // Clean, daylight visual card
      visual: (
        <div className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              AI Match Detection
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              96.4% Match
            </span>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Image &amp; Description Similarity</span>
              <span className="font-bold text-indigo-600">High Confidence</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full w-[96%]" />
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Lost #402 &bull; Found #518</span>
              <span className="text-emerald-600 font-bold">Instant Alert Sent ✓</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      tab: "3. Safe Return",
      title: "Confirm ownership & get reunited",
      description:
        "Claimants answer a private security proof check to ensure zero fraud. Handover happens safely at verified Sylhet hubs.",
      // Clean, daylight visual card
      visual: (
        <div className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Ownership Verified
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Approved ✓
            </span>
          </div>

          <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Secret Proof: Student ID Confirmed</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold pl-5">
              Ready for Handover &bull; Amberkhana Hub
            </p>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[activeStep];

  const handleNext = () => {
    if (activeStep < 2) {
      setActiveStep((prev) => prev + 1);
    } else {
      onClose();
      onBrowseFeed?.();
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-900">
        {/* Header: Clean, White, Airy */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">How FindIt Works</h3>
            <p className="text-xs text-slate-500">Simple 3-step recovery guide for Sylhet</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Segmented Track: 3 Light Tabs */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(idx)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeStep === idx
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {s.tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stage: Visual Showcase Box */}
        <div className="px-6 py-6 space-y-5 text-center">
          {/* Visual Showcase Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-center justify-center">
            {current.visual}
          </div>

          {/* Clean 1-Line Explanation */}
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-base font-bold text-slate-900">{current.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{current.description}</p>
          </div>
        </div>

        {/* Footer Controls: Calm & Pleasant */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeStep === i ? "w-5 bg-slate-900" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <span>{activeStep === 2 ? "Got It, Explore Feed" : "Next Step"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
