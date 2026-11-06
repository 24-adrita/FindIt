"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "../components/Navbar";
import ItemUploadForm from "../components/ItemUploadForm";
import RecentItemsList from "../components/RecentItemsList";
import AdminPreview from "../components/AdminPreview";
import WeightsModal from "../components/WeightsModal";
import MatchesModal from "../components/MatchesModal";
import AuthModal from "../components/AuthModal";
import ClaimModal from "../components/ClaimModal";
import ProposalModal from "../components/ProposalModal";
import HowItWorksModal from "../components/HowItWorksModal";
import HowItWorksSection from "../components/HowItWorksSection";
import Footer from "../components/Footer";
import { SAMPLE_CAMPUS_ITEMS } from "../data/sampleItems";
import { StoredItemReport, ReportType } from "../types/item";
import { fetchItems } from "../services/api";
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Database,
  Lock,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const [items, setItems] = useState<StoredItemReport[]>(SAMPLE_CAMPUS_ITEMS);
  const [isWeightsOpen, setIsWeightsOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [selectedLostItem, setSelectedLostItem] = useState<StoredItemReport | null>(null);
  const [claimItem, setClaimItem] = useState<StoredItemReport | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Active view tab: "feed" (items & map) | "report" (upload form) | "admin" (preview)
  const [activeTab, setActiveTab] = useState<"feed" | "report" | "admin">("feed");
  const [reportFormType, setReportFormType] = useState<ReportType>("lost");
  const [feedViewMode, setFeedViewMode] = useState<"grid" | "map">("grid");

  // Category filter sync with feed
  const [heroCategory] = useState("all");
  const [feedTypeFilter] = useState<"all" | "lost" | "found">("all");

  // Step-by-step AI matching simulation states
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [scanStep, setScanStep] = useState<number>(3); // 0: laser sweep, 1: visual match, 2: semantic match, 3: completed
  const [visualProgress, setVisualProgress] = useState<number>(98.2);
  const [semanticProgress, setSemanticProgress] = useState<number>(94.5);

  // Interactive mouse spotlight aura in Hero
  const [heroMousePos, setHeroMousePos] = useState({ x: 50, y: 50 });
  const [isHoveringHero, setIsHoveringHero] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setHeroMousePos({ x, y });
  };

  const triggerLiveMatchSimulation = useCallback(() => {
    if (isSimulatingScan) return;
    setIsSimulatingScan(true);
    setScanStep(0);
    setVisualProgress(0);
    setSemanticProgress(0);

    // Step 1: Laser scanning active, then trigger visual feature extraction at 850ms
    setTimeout(() => {
      setScanStep(1);
      setVisualProgress(98.2);
    }, 850);

    // Step 2: Semantic feature extraction at 1800ms
    setTimeout(() => {
      setScanStep(2);
      setSemanticProgress(94.5);
    }, 1800);

    // Step 3: Match verified at 2700ms
    setTimeout(() => {
      setScanStep(3);
      setIsSimulatingScan(false);
    }, 2700);
  }, [isSimulatingScan]);

  const contentRef = useRef<HTMLDivElement>(null);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dbItems = await fetchItems();
      if (dbItems && dbItems.length > 0) {
        setItems(dbItems);
      }
      setIsLive(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to backend server.";
      setError(message);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    let ignore = false;
    fetchItems()
      .then((dbItems) => {
        if (!ignore) {
          if (dbItems && dbItems.length > 0) {
            setItems(dbItems);
          }
          setIsLive(true);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const message =
            err instanceof Error ? err.message : "Failed to connect to backend server.";
          setError(message);
          setIsLive(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleReportCreated = (newReport: StoredItemReport) => {
    setItems((prev) => [newReport, ...prev]);
    setIsLive(true);
    // Switch to feed so user immediately sees their report!
    setActiveTab("feed");
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const scrollToSection = (id: string) => {
    if (id === "report-form") {
      setActiveTab("report");
    } else if (id === "map" || id === "map-view") {
      setActiveTab("feed");
      setFeedViewMode("map");
    } else if (id === "recent-items") {
      setActiveTab("feed");
      setFeedViewMode("grid");
    } else if (id === "how-it-works") {
      setActiveTab("feed");
    } else if (id === "admin-preview") {
      setActiveTab("admin");
    }
    setTimeout(() => {
      const targetId = (id === "map" || id === "map-view") ? "recent-items" : id;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        contentRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }, 80);
  };

  const handleOpenLostReport = () => {
    setReportFormType("lost");
    setActiveTab("report");
    setTimeout(() => {
      document.getElementById("report-form")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleOpenFoundReport = () => {
    setReportFormType("found");
    setActiveTab("report");
    setTimeout(() => {
      document.getElementById("report-form")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };



  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#F3F4EF] selection:bg-[#45B58A] selection:text-[#141715]">
      {/* Navigation Header */}
      <Navbar
        onOpenWeights={() => setIsWeightsOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenProposal={() => setIsProposalOpen(true)}
        onNavigateSection={scrollToSection}
        onOpenAuth={(tab) => {
          setAuthModalTab(tab);
          setAuthModalOpen(true);
        }}
      />

      {/* Hero Section: Modern, Concise Sylhet Lost & Found Network */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseEnter={() => setIsHoveringHero(true)}
        onMouseLeave={() => setIsHoveringHero(false)}
        className="relative overflow-hidden pt-10 pb-16 lg:pt-14 lg:pb-20 border-b border-[#2C342E] bg-transparent"
      >
        {/* Real Sylhet Cityscape Skyline Backdrop with Calm Ambient Glow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/images/sylhet_city_hero.jpg"
            alt="Sylhet Keane Bridge Cityscape"
            className="w-full h-full object-cover object-center opacity-50 transform scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141715] via-[#141715]/75 to-[#141715]/45" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#141715]/30 to-[#141715]/85" />

          {/* Balanced Ambient Emerald Lighting Accents */}
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#45B58A]/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 left-10 w-[380px] h-[380px] rounded-full bg-[#45B58A]/8 blur-[90px] pointer-events-none" />

          {/* Interactive Mouse Spotlight Aura (follows cursor) */}
          <div
            className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHoveringHero ? 0.7 : 0.3,
              background: `radial-gradient(600px circle at ${heroMousePos.x}% ${heroMousePos.y}%, rgba(69, 181, 138, 0.10), transparent 70%)`,
            }}
          />

          {/* Subtle Perspective Grid Line Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#383E3918_1px,transparent_1px),linear-gradient(to_bottom,#383E3918_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 animate-grid-flow" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Punchy Headline & Clean CTAs */}
            <div className="lg:col-span-7 text-left space-y-6 animate-slide-up">
              {/* Minimal Top Pill with Live Radar Pulse */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#1C221E] text-[#45B58A] border border-[#313A33] shadow-xs animate-slide-down">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#45B58A] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#45B58A]" />
                </span>
                <span>MULTIMODAL LOST &amp; FOUND PLATFORM</span>
              </div>

              {/* Bold, Catchy Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-bold tracking-tight text-[#F3F4EF] leading-[1.05]">
                Lost it?<br />
                <span className="text-[#45B58A]">
                  FindIt.
                </span>
              </h1>

              {/* Concise, Readable Subtitle with enhanced contrast */}
              <p className="text-sm sm:text-base text-[#C4CBC5] leading-relaxed max-w-lg">
                Report lost or found belongings, discover instant multimodal AI matches, and verify ownership securely across campuses and metropolitan hubs.
              </p>

              {/* Action Buttons: Emerald for Primary Action */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenFoundReport}
                  className="px-5 py-2.5 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#141715] font-bold text-xs sm:text-sm shadow-md shadow-[#45B58A]/15 transition cursor-pointer active:scale-95"
                >
                  Report Found Item
                </button>
                <button
                  type="button"
                  onClick={handleOpenLostReport}
                  className="px-5 py-2.5 rounded-xl bg-[#1C221E] hover:bg-[#232A25] text-[#F3F4EF] font-semibold text-xs sm:text-sm border border-[#313A33] hover:border-[#45B58A]/50 transition cursor-pointer active:scale-95 shadow-sm"
                >
                  Report Lost Item
                </button>
                <Link
                  href="/benchmark"
                  className="px-4 py-2.5 rounded-xl bg-[#1C221E] hover:bg-[#232A25] text-[#45B58A] font-semibold text-xs sm:text-sm border border-[#45B58A]/40 hover:border-[#45B58A] transition cursor-pointer active:scale-95 shadow-sm inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#45B58A]" />
                  <span>AI Benchmark (350 Pairs)</span>
                </Link>
              </div>
            </div>

            {/* Right Column: AI Live Match Pair Showcase Card with Interactive Simulation */}
            <div className="lg:col-span-5 relative animate-subtle-float">
              <div className="relative rounded-3xl bg-[#1C221E]/95 border border-[#343D36] shadow-2xl shadow-black/60 overflow-hidden text-left animate-scale-in backdrop-blur-md">
                {/* Showcase Header */}
                <div className="px-5 py-3.5 bg-[#161B18] text-[#F3F4EF] flex items-center justify-between border-b border-[#2C342E]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isSimulatingScan ? 'bg-[#45B58A] animate-ping' : 'bg-[#45B58A] animate-pulse'}`} />
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#C4CBC5] truncate max-w-[200px]">
                      {scanStep === 0 && "1/3 Scanning Sensors..."}
                      {scanStep === 1 && "2/3 OpenCLIP Matching..."}
                      {scanStep === 2 && "3/3 S-BERT Semantic Match..."}
                      {scanStep === 3 && "Live Match Verification"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={triggerLiveMatchSimulation}
                      disabled={isSimulatingScan}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#45B58A]/15 hover:bg-[#45B58A]/25 text-[#45B58A] border border-[#45B58A]/30 transition active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Click to trigger step-by-step AI neural match simulation"
                    >
                      <Sparkles className={`w-3 h-3 text-[#45B58A] ${isSimulatingScan ? 'animate-spin' : ''}`} />
                      <span>{isSimulatingScan ? "Scanning..." : "Test AI Match"}</span>
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Match Comparison */}
                <div className="p-4 bg-[#141815]/70 border-b border-[#2C342E] relative">
                  {/* Laser Scanning Line Overlay when Simulation is active */}
                  {isSimulatingScan && (
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-xl">
                      <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#45B58A] to-transparent shadow-[0_0_12px_#45B58A] animate-laser-sweep" />
                      <div className="absolute inset-0 bg-[#45B58A]/5 animate-pulse" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 relative">
                    {/* Left: Lost Item Report */}
                    <div className="p-2.5 rounded-2xl bg-[#181D19] border border-[#2E3630] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#222924] text-[#C4CBC5] border border-[#313A33]">
                          LOST REPORT
                        </span>
                        <span className="text-[10px] text-[#A2ABA4]">12 Oct</span>
                      </div>
                      <div className="h-28 w-full rounded-xl overflow-hidden bg-[#141815] relative border border-[#2E3630]">
                        <img
                          src="/images/sylhet_cng_wallet.jpg"
                          alt="Lost Wallet"
                          className="w-full h-full object-cover object-center opacity-85"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-semibold text-xs text-[#F3F4EF] truncate">Black Bifold Wallet</h3>
                        <p className="text-[10px] text-[#C4CBC5] flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-[#45B58A] shrink-0" />
                          Zindabazar Point
                        </p>
                      </div>
                    </div>

                    {/* Right: Found Item Report */}
                    <div className="p-2.5 rounded-2xl bg-[#181D19] border border-[#2E3630] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#45B58A] text-[#141715]">
                          FOUND ITEM
                        </span>
                        <span className="text-[10px] text-[#45B58A] font-semibold">Active Hub</span>
                      </div>
                      <div className="h-28 w-full rounded-xl overflow-hidden bg-[#141815] relative border border-[#2E3630]">
                        <img
                          src="/images/sylhet_cng_wallet.jpg"
                          alt="Found Wallet in CNG"
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-semibold text-xs text-[#F3F4EF] truncate">Leather Wallet in CNG</h3>
                        <p className="text-[10px] text-[#C4CBC5] flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-[#45B58A] shrink-0" />
                          Amberkhana Stand
                        </p>
                      </div>
                    </div>

                    {/* Center Animated Match Pill */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                      <div className="relative w-8 h-8 rounded-full bg-[#141715] border border-[#45B58A] shadow-lg shadow-black/40 flex items-center justify-center text-[#45B58A]">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Attribution & Similarity Bars */}
                <div className="p-4 space-y-3 bg-[#1C221E]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#C4CBC5] font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#45B58A]" />
                      <span>Zindabazar &harr; Amberkhana (1.8 km)</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#45B58A] bg-[#45B58A]/15 px-2.5 py-0.5 rounded-full border border-[#45B58A]/30">
                      {scanStep === 3 ? "Confidence: 96.4%" : "Calculating..."}
                    </span>
                  </div>

                  {/* Similarity Bars */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-[#C4CBC5] mb-1">
                        <span>Visual Image Match (OpenCLIP ViT-B/32)</span>
                        <span className="font-bold text-[#45B58A] transition-all duration-300">
                          {visualProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#141815] rounded-full overflow-hidden border border-[#2A322C]">
                        <div
                          className="h-full bg-[#45B58A] rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(69,181,138,0.5)]"
                          style={{ width: `${visualProgress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-[#C4CBC5] mb-1">
                        <span>Semantic Description Match (S-BERT)</span>
                        <span className="font-bold text-[#45B58A] transition-all duration-300">
                          {semanticProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#141815] rounded-full overflow-hidden border border-[#2A322C]">
                        <div
                          className="h-full bg-[#45B58A]/90 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(69,181,138,0.3)]"
                          style={{ width: `${semanticProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Link & Human Gate */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#2C342E] text-[11px]">
                    <span className="flex items-center gap-1.5 text-[#A2ABA4]">
                      <Lock className="w-3 h-3 text-[#45B58A]" />
                      <span>Human Verification Gate</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsWeightsOpen(true)}
                      className="font-bold text-[#45B58A] hover:underline transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>How AI Matched</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Bottom Feature Cards */}
          <div className="mt-10 pt-8 border-t border-[#2C342E] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-[#1B211D] border border-[#313A33] space-y-1.5 hover:border-[#45B58A]/50 hover:bg-[#202722] shadow-sm hover:shadow-lg hover:shadow-black/25 transition-all duration-300 group cursor-default">
              <div className="flex items-center gap-2 text-[#45B58A]">
                <Database className="w-4 h-4" />
                <h4 className="text-xs font-semibold text-[#F3F4EF]">Reports submitted</h4>
              </div>
              <p className="text-[11px] text-[#B8C0B9] leading-snug">
                Live count from the database
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1B211D] border border-[#313A33] space-y-1.5 hover:border-[#45B58A]/50 hover:bg-[#202722] shadow-sm hover:shadow-lg hover:shadow-black/25 transition-all duration-300 group cursor-default">
              <div className="flex items-center gap-2 text-[#45B58A]">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-xs font-semibold text-[#F3F4EF]">AI-assisted matching</h4>
              </div>
              <p className="text-[11px] text-[#B8C0B9] leading-snug">
                Potential matches, not guarantees
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1B211D] border border-[#313A33] space-y-1.5 hover:border-[#45B58A]/50 hover:bg-[#202722] shadow-sm hover:shadow-lg hover:shadow-black/25 transition-all duration-300 group cursor-default">
              <div className="flex items-center gap-2 text-[#45B58A]">
                <MapPin className="w-4 h-4" />
                <h4 className="text-xs font-semibold text-[#F3F4EF]">Supported locations</h4>
              </div>
              <p className="text-[11px] text-[#B8C0B9] leading-snug">
                Configurable Sylhet areas
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1B211D] border border-[#313A33] space-y-1.5 hover:border-[#45B58A]/50 hover:bg-[#202722] shadow-sm hover:shadow-lg hover:shadow-black/25 transition-all duration-300 group cursor-default">
              <div className="flex items-center gap-2 text-[#45B58A]">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-semibold text-[#F3F4EF]">Privacy verification</h4>
              </div>
              <p className="text-[11px] text-[#B8C0B9] leading-snug">
                Confidential proofs &amp; safe handover
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3-Step Interactive How It Works Section */}
      {activeTab === "feed" && (
        <HowItWorksSection
          onOpenReport={(type) => {
            if (type === "lost") handleOpenLostReport();
            else handleOpenFoundReport();
          }}
          onExploreFeed={() => scrollToSection("recent-items")}
        />
      )}

      {/* Main Content Area */}
      <main ref={contentRef} className="flex-1 pb-16 pt-8 bg-[#171A18]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Tab 1: Live Feed and Map */}
          {activeTab === "feed" && (
            <div id="recent-items" className="animate-in fade-in duration-200">
              <RecentItemsList
                items={items}
                isLoading={isLoading}
                error={error}
                onRefresh={handleRefresh}
                isLive={isLive}
                onFindMatches={(item) => setSelectedLostItem(item)}
                onClaimItem={(item) => setClaimItem(item)}
                externalCategory={heroCategory}
                externalType={feedTypeFilter}
                externalViewMode={feedViewMode}
              />
            </div>
          )}

          {/* Tab 2: Item Upload Form */}
          {activeTab === "report" && (
            <div id="report-form" className="animate-in fade-in duration-200 space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#252B27] border border-[#383E39] rounded-2xl">
                <div>
                  <h2 className="text-sm font-semibold text-[#F3F4EF]">
                    Submitting a {reportFormType === "lost" ? "Lost" : "Found"} Item Report
                  </h2>
                  <p className="text-xs text-[#A9B0AA]">
                    Provide clear details and photos so our matching engine can connect it accurately.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("feed")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#F3F4EF] bg-[#171A18] border border-[#383E39] hover:bg-[#252B27] transition cursor-pointer"
                >
                  &larr; Back to Items Feed
                </button>
              </div>

              <ItemUploadForm
                initialType={reportFormType}
                onReportCreated={handleReportCreated}
                onRequireAuth={() => {
                  setAuthModalTab("login");
                  setAuthModalOpen(true);
                }}
              />
            </div>
          )}

          {/* Tab 3: Admin & Verification Preview */}
          {activeTab === "admin" && (
            <div id="admin-preview" className="animate-in fade-in duration-200 space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#252B27] text-[#F3F4EF] rounded-2xl border border-[#383E39]">
                <div>
                  <h2 className="text-sm font-semibold text-[#F3F4EF]">
                    Verification &amp; Recovery Management Portal
                  </h2>
                  <p className="text-xs text-[#A9B0AA]">
                    Review incoming claims, inspect match confidence scores, and verify legitimate ownership.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("feed")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#F3F4EF] bg-[#171A18] border border-[#383E39] hover:bg-[#252B27] transition cursor-pointer"
                >
                  &larr; Back to Items Feed
                </button>
              </div>

              <AdminPreview />
            </div>
          )}
        </div>
      </main>

      {/* Weights and Formulation Modal */}
      <WeightsModal
        isOpen={isWeightsOpen}
        onClose={() => setIsWeightsOpen(false)}
      />

      {/* Public Civic How It Works Guide */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onOpenReport={(type) => {
          if (type === "lost") handleOpenLostReport();
          else handleOpenFoundReport();
        }}
        onBrowseFeed={() => {
          setActiveTab("feed");
          setTimeout(() => {
            contentRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 80);
        }}
      />

      {/* Project Proposal & Features Modal (Academic / Defense Specs) */}
      <ProposalModal
        isOpen={isProposalOpen}
        onClose={() => setIsProposalOpen(false)}
      />

      {/* Explainable Multimodal Matches Modal */}
      <MatchesModal
        lostItem={selectedLostItem}
        isOpen={Boolean(selectedLostItem)}
        onClose={() => setSelectedLostItem(null)}
      />

      {/* User Authentication Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />

      {/* Confidential Ownership Claim Modal */}
      <ClaimModal
        item={claimItem}
        isOpen={Boolean(claimItem)}
        onClose={() => setClaimItem(null)}
        onClaimSubmitted={() => {
          handleRefresh();
        }}
      />

      {/* Platform Footer */}
      <Footer
        onOpenProposal={() => setIsProposalOpen(true)}
        onOpenWeights={() => setIsWeightsOpen(true)}
      />
    </div>
  );
}
