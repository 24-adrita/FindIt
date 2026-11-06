"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import MatchesModal from "../../components/MatchesModal";
import ClaimModal from "../../components/ClaimModal";
import AuthModal from "../../components/AuthModal";
import WeightsModal from "../../components/WeightsModal";
import { SAMPLE_CAMPUS_ITEMS } from "../../data/sampleItems";
import { StoredItemReport, CAMPUS_LOCATIONS } from "../../types/item";
import { fetchItems, resolveImageUrl } from "../../services/api";
import {
  MapPin,
  Sparkles,
  ShieldAlert,
  Search,
  Compass,
  ArrowRight,
} from "lucide-react";

// Dynamically import Leaflet map component to prevent SSR issues
const DynamicLeafletMap = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      <span className="text-xs font-semibold tracking-wider uppercase text-cyan-300">
        Loading Sylhet Map...
      </span>
    </div>
  ),
});

export default function MapPage() {
  const [items, setItems] = useState<StoredItemReport[]>(SAMPLE_CAMPUS_ITEMS);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  // Modals
  const [selectedLostItem, setSelectedLostItem] = useState<StoredItemReport | null>(null);
  const [claimItem, setClaimItem] = useState<StoredItemReport | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [isWeightsOpen, setIsWeightsOpen] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const data = await fetchItems();
      if (data && data.length > 0) {
        setItems(data);
      }
    } catch (err: unknown) {
      console.warn("Using sample items for map:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchItems()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setItems(data);
        }
      })
      .catch((err: unknown) => {
        console.warn("Using sample items for map:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getLocationName = (locationIdOrName?: string) => {
    if (!locationIdOrName) return "";
    return (
      CAMPUS_LOCATIONS.find((l) => l.id === locationIdOrName)?.name ||
      locationIdOrName
    );
  };

  // Filter items based on active criteria
  const filteredItems = items.filter((item) => {
    const itemType = (item.type || item.reportType || "lost").toLowerCase();
    if (filterType !== "all" && itemType !== filterType) return false;

    const locZone = item.location?.campusZone || getLocationName(item.campusLocation) || "";
    const locId = item.campusLocation || "";

    if (
      selectedZone !== "all" &&
      locId !== selectedZone &&
      !locZone.toLowerCase().includes(selectedZone.toLowerCase())
    ) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      const matches =
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        locZone.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-[#171A18] text-[#F3F4EF] selection:bg-[#45B58A] selection:text-[#171A18] overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        onOpenWeights={() => setIsWeightsOpen(true)}
        onOpenAuth={(tab) => {
          setAuthModalTab(tab);
          setAuthModalOpen(true);
        }}
      />

      {/* Split-Screen Map Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Panel: Scrollable Items List & Quick Filters */}
        <aside className="w-full md:w-[420px] lg:w-[460px] h-[45vh] md:h-full bg-[#252B27] border-r border-[#383E39] flex flex-col z-10 shrink-0">
          {/* Header & Filter Controls */}
          <div className="p-4 border-b border-[#383E39] space-y-3 bg-[#171A18]/90 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#45B58A] animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F3F4EF]">
                  Sylhet Live Map Radar
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#45B58A]/10 text-[#45B58A] border border-[#45B58A]/30">
                {filteredItems.length} Mapped Pins
              </span>
            </div>

            {/* Keyword Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#A9B0AA] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mapped reports..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#171A18] border border-[#383E39] text-xs text-[#F3F4EF] placeholder-[#A9B0AA] focus:outline-none focus:border-[#45B58A] transition"
              />
            </div>

            {/* Filter Pills (All / Lost / Found) */}
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-3 gap-1 p-1 bg-[#171A18] rounded-xl border border-[#383E39] text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`py-1 rounded-lg font-semibold transition cursor-pointer ${
                    filterType === "all"
                      ? "bg-[#383E39] text-[#F3F4EF] shadow-xs"
                      : "text-[#A9B0AA] hover:text-[#F3F4EF]"
                  }`}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("lost")}
                  className={`py-1 rounded-lg font-semibold transition cursor-pointer ${
                    filterType === "lost"
                      ? "bg-[#383E39] text-[#F3F4EF] border border-[#383E39]"
                      : "text-[#A9B0AA] hover:text-[#F3F4EF]"
                  }`}
                >
                  Lost
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("found")}
                  className={`py-1 rounded-lg font-semibold transition cursor-pointer ${
                    filterType === "found"
                      ? "bg-[#45B58A] text-[#171A18] font-bold"
                      : "text-[#A9B0AA] hover:text-[#45B58A]"
                  }`}
                >
                  Found
                </button>
              </div>

              {/* Zone dropdown */}
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#171A18] border border-[#383E39] text-xs text-[#F3F4EF] focus:outline-none focus:border-[#45B58A] cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">All Zones</option>
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable Item Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-[#383E39]/40">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-[#A9B0AA] text-xs space-y-2">
                <Compass className="w-8 h-8 text-[#A9B0AA] mx-auto" />
                <p>No mapped items match your current filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                    setSelectedZone("all");
                  }}
                  className="text-[#45B58A] font-semibold hover:underline"
                >
                  Reset Map Filters
                </button>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isLost = (item.type || item.reportType) === "lost";
                const isFocused = (item._id || item.id) === focusedItemId;
                const rawUrl =
                  (item.imageUrls && item.imageUrls[0]) ||
                  (item.images && item.images[0]?.previewUrl) ||
                  null;
                const imageUrl = resolveImageUrl(rawUrl);
                const locZone =
                  item.location?.campusZone || getLocationName(item.campusLocation);

                return (
                  <div
                    key={item._id || item.id}
                    onClick={() => setFocusedItemId(item._id || item.id)}
                    className={`p-3 rounded-xl transition-all cursor-pointer flex gap-3 ${
                      isFocused
                        ? "bg-[#171A18] border-2 border-[#45B58A] shadow-md"
                        : "bg-[#171A18]/60 hover:bg-[#171A18] border border-[#383E39]"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#252B27] shrink-0 border border-[#383E39] flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Compass className="w-6 h-6 text-[#A9B0AA]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                              isLost
                                ? "bg-[#252B27] text-[#F3F4EF] border border-[#383E39]"
                                : "bg-[#45B58A] text-[#171A18]"
                            }`}
                          >
                            {isLost ? "Lost" : "Found"}
                          </span>
                          <span className="text-[10px] text-[#A9B0AA] truncate">
                            {item.dateTime
                              ? String(item.dateTime).slice(0, 10)
                              : "Recent"}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-[#F3F4EF] truncate mt-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#A9B0AA] truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#45B58A] shrink-0" />
                          <span className="truncate">{locZone}</span>
                        </p>
                      </div>

                      {/* Action trigger */}
                      <div className="mt-1.5 flex items-center gap-2">
                        {isLost ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLostItem(item);
                            }}
                            className="text-[10px] font-semibold text-[#45B58A] hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Find Matches
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClaimItem(item);
                            }}
                            className="text-[10px] font-bold text-[#45B58A] hover:underline flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            Claim Item
                          </button>
                        )}
                        <span className="text-[10px] text-[#A9B0AA] ml-auto flex items-center gap-0.5">
                          <span>Focus Map</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Panel: Full-Height Interactive Leaflet Map Canvas */}
        <main className="flex-1 h-[55vh] md:h-full relative overflow-hidden bg-[#171A18]">
          <DynamicLeafletMap
            items={filteredItems}
            focusedItemId={focusedItemId}
            onFindMatches={(item) => setSelectedLostItem(item)}
            onClaimItem={(item) => setClaimItem(item)}
            selectedZone={selectedZone}
            onSelectZone={(zoneId) => setSelectedZone(zoneId)}
          />

          {/* Floating Back to Explorer Link */}
          <div className="absolute top-4 right-4 z-20">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252B27] hover:bg-[#383E39] border border-[#383E39] text-xs font-semibold text-[#F3F4EF] shadow-md transition active:scale-95"
            >
              <span>Catalog View</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#45B58A]" />
            </Link>
          </div>
        </main>
      </div>

      {/* Shared Modals */}
      <MatchesModal
        lostItem={selectedLostItem}
        isOpen={Boolean(selectedLostItem)}
        onClose={() => setSelectedLostItem(null)}
      />

      <ClaimModal
        item={claimItem}
        isOpen={Boolean(claimItem)}
        onClose={() => setClaimItem(null)}
        onClaimSubmitted={() => {
          setClaimItem(null);
          loadItems();
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />

      <WeightsModal
        isOpen={isWeightsOpen}
        onClose={() => setIsWeightsOpen(false)}
      />
    </div>
  );
}
