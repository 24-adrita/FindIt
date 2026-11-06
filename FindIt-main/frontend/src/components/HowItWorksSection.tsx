"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  Sparkles,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Lock,
  UploadCloud,
  Play,
  Pause,
} from "lucide-react";

interface HowItWorksSectionProps {
  onOpenReport?: (type: "lost" | "found") => void;
  onExploreFeed?: () => void;
}

export default function HowItWorksSection({
  onOpenReport,
}: HowItWorksSectionProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Gentle, calm 4.5s transition - easy on the eyes
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const steps = [
    {
      num: "01",
      step: "Step 01",
      title: "Snap & Report",
      subtitle: "30 Seconds",
      description:
        "Take a quick photo, mention the color & brand, and select the landmark in Sylhet where it was lost or found.",
      icon: Camera,
      accentBorder: "border-[#45B58A]/70 bg-[#222A24] shadow-xl shadow-black/40 shadow-[#45B58A]/10 -translate-y-1",
      accentPill: "bg-[#45B58A]/20 text-[#45B58A] border-[#45B58A]/40",
      accentIcon: "text-[#45B58A] bg-[#141715] border-[#45B58A]/40",
      preview: (isActive: boolean) => (
        <div
          className={`p-3.5 rounded-2xl bg-[#151916] border transition-colors duration-300 text-left space-y-2.5 ${
            isActive ? "border-[#45B58A]/30" : "border-[#2E3630]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#F3F4EF] font-medium">
              <UploadCloud className="w-3.5 h-3.5 text-[#45B58A]" />
              <span>Report Submitted</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] bg-[#1F2621] text-[#C4CBC5] font-semibold border border-[#313A33]">
              Lost Item
            </span>
          </div>

          <div className="flex items-center gap-3">
            <img
              src="/images/sylhet_cng_wallet.jpg"
              alt="Wallet"
              className="w-12 h-12 rounded-xl object-cover border border-[#2E3630] shrink-0"
            />
            <div className="overflow-hidden space-y-0.5">
              <p className="text-xs font-semibold text-[#F3F4EF] truncate">Leather Bifold Wallet</p>
              <p className="text-[11px] text-[#C4CBC5] flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-[#45B58A] shrink-0" />
                Amberkhana CNG Stand
              </p>
              <p className="text-[10px] text-[#45B58A] font-medium">Active on Sylhet Hubs</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "02",
      step: "Step 02",
      title: "Intelligent Match",
      subtitle: "Instant Analysis",
      description:
        "The system instantly analyzes image features, colors, and descriptions across the city to detect accurate pairs.",
      icon: Sparkles,
      accentBorder: "border-[#45B58A]/70 bg-[#222A24] shadow-xl shadow-black/40 shadow-[#45B58A]/10 -translate-y-1",
      accentPill: "bg-[#45B58A]/20 text-[#45B58A] border-[#45B58A]/40",
      accentIcon: "text-[#45B58A] bg-[#141715] border-[#45B58A]/40",
      preview: (isActive: boolean) => (
        <div
          className={`p-3.5 rounded-2xl bg-[#151916] border transition-colors duration-300 text-left space-y-2.5 ${
            isActive ? "border-[#45B58A]/30" : "border-[#2E3630]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#F3F4EF] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#45B58A]" />
              <span>Citywide Cross-Match</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] bg-[#45B58A]/15 text-[#45B58A] font-bold border border-[#45B58A]/30 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>96.4% Match</span>
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex justify-between text-[11px] text-[#C4CBC5]">
              <span>Visual &amp; Description Match</span>
              <span className="text-[#F3F4EF] font-semibold">High Confidence</span>
            </div>
            <div className="w-full h-1.5 bg-[#141715] rounded-full overflow-hidden border border-[#2A322C]">
              <div
                className="h-full bg-[#45B58A] rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(69,181,138,0.5)]"
                style={{ width: "96%" }}
              />
            </div>
            <div className="text-[10px] text-[#C4CBC5] pt-0.5 flex items-center justify-between">
              <span>Lost #402 &bull; Found #518</span>
              <span className="text-[#45B58A] font-medium flex items-center gap-1">
                <span>Alert Sent</span>
                <CheckCircle2 className="w-3 h-3 text-[#45B58A]" />
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      step: "Step 03",
      title: "Verify & Return",
      subtitle: "Safe Handover",
      description:
        "Claimants answer a private security proof check to verify genuine ownership. Handover happens safely at verified Sylhet hubs.",
      icon: ShieldCheck,
      accentBorder: "border-[#45B58A]/70 bg-[#222A24] shadow-xl shadow-black/40 shadow-[#45B58A]/10 -translate-y-1",
      accentPill: "bg-[#45B58A]/20 text-[#45B58A] border-[#45B58A]/40",
      accentIcon: "text-[#45B58A] bg-[#141715] border-[#45B58A]/40",
      preview: (isActive: boolean) => (
        <div
          className={`p-3.5 rounded-2xl bg-[#151916] border transition-colors duration-300 text-left space-y-2.5 ${
            isActive ? "border-[#45B58A]/30" : "border-[#2E3630]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#F3F4EF] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#45B58A]" />
              <span>Ownership Gate</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] bg-[#45B58A]/15 text-[#45B58A] font-bold border border-[#45B58A]/30 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Verified</span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-[#F3F4EF]">
              <Lock className="w-3 h-3 text-[#45B58A] shrink-0" />
              <span className="truncate">Proof Confirmed: Ownership &amp; Identity Match</span>
            </div>
            <p className="text-[10px] text-[#45B58A] font-medium pt-0.5">
              Pickup Point &bull; Amberkhana Verified Hub
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-16 sm:py-20 bg-transparent border-b border-[#2C342E] overflow-hidden text-center"
    >
      {/* Ambient Emerald Backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#45B58A]/6 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Calm Header */}
        <div className="max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1C221E] border border-[#313A33] text-[#C4CBC5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#45B58A]" />
            <span>How FindIt Works</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#F3F4EF] tracking-tight">
            Simple 3-Step Recovery Across Sylhet
          </h2>

          <p className="text-xs sm:text-sm text-[#C4CBC5] max-w-lg mx-auto leading-relaxed">
            A trustworthy, community-powered lost and found network connecting citizens across Sylhet City.
          </p>
        </div>

        {/* Minimalist Stage Controls */}
        <div className="max-w-md mx-auto flex items-center justify-between gap-1.5 p-1 rounded-xl bg-[#1C221E] border border-[#313A33] text-xs">
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={s.num}
                onClick={() => {
                  setActiveStep(idx);
                  setIsPaused(true);
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isActive
                    ? "bg-[#29332B] text-[#F3F4EF] shadow-xs"
                    : "text-[#A2ABA4] hover:text-[#F3F4EF]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-[#45B58A]" : "bg-[#333C35]"
                  }`}
                />
                <span className="truncate">{s.title}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#A2ABA4] hover:text-[#45B58A] hover:bg-[#28322A] transition cursor-pointer shrink-0"
            title={isPaused ? "Play auto-rotation" : "Pause auto-rotation"}
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
          </button>
        </div>

        {/* 3 Calm Balanced Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeStep === index;

            return (
              <div
                key={item.num}
                onMouseEnter={() => {
                  setActiveStep(index);
                  setIsPaused(true);
                }}
                onMouseLeave={() => setIsPaused(false)}
                onClick={() => {
                  setActiveStep(index);
                  setIsPaused(true);
                }}
                className={`p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between border ${
                  isActive
                    ? item.accentBorder
                    : "bg-[#1C221E] border-[#313A33] hover:border-[#45B58A]/50 hover:bg-[#202722] shadow-md shadow-black/25"
                }`}
              >
                <div className="space-y-4">
                  {/* Step Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        isActive
                          ? item.accentPill
                          : "bg-[#141715] text-[#A2ABA4] border-[#313A33]"
                      }`}
                    >
                      {item.step} &bull; {item.subtitle}
                    </span>

                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
                        isActive
                          ? item.accentIcon
                          : "bg-[#141715] border-[#313A33] text-[#A2ABA4]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[#F3F4EF]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#C4CBC5] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Mini Preview Component */}
                  <div className="pt-1">{item.preview(isActive)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges & Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#2C342E] text-xs">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[#C4CBC5]">
            <span className="flex items-center gap-1.5 text-[#F3F4EF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#45B58A]" />
              100% Free Public Network
            </span>
            <span className="h-3 w-px bg-[#313A33] hidden sm:block" />
            <span className="flex items-center gap-1.5 text-[#F3F4EF]">
              <Lock className="w-3.5 h-3.5 text-[#45B58A]" />
              Private Data Protected
            </span>
            <span className="h-3 w-px bg-[#313A33] hidden sm:block" />
            <span className="flex items-center gap-1.5 text-[#F3F4EF]">
              <MapPin className="w-3.5 h-3.5 text-[#45B58A]" />
              Sylhet Network Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenReport?.("lost")}
              className="px-3.5 py-1.5 rounded-xl bg-[#1C221E] hover:bg-[#252E27] text-[#F3F4EF] font-semibold text-xs border border-[#313A33] hover:border-[#45B58A]/50 transition cursor-pointer active:scale-95 shadow-xs"
            >
              + Report Lost Item
            </button>
            <button
              type="button"
              onClick={() => onOpenReport?.("found")}
              className="px-3.5 py-1.5 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#141715] font-bold text-xs shadow-md shadow-[#45B58A]/15 transition cursor-pointer active:scale-95"
            >
              + Report Found Item
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
