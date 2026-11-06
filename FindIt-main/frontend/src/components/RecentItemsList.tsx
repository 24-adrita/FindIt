"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Search,
  MapPin,
  Clock,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  Database,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  LayoutGrid,
  Laptop,
  CreditCard,
  BookOpen,
  Briefcase,
  Coffee,
  Key,
  Shirt,
  Tag,
  X,
  ArrowRight,
} from "lucide-react";
import { StoredItemReport, CAMPUS_LOCATIONS } from "../types/item";
import { resolveImageUrl } from "../services/api";

const CampusMapView = dynamic(() => import("./CampusMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[480px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-sm animate-pulse border border-slate-200">
      Loading Sylhet &amp; Campus Interactive Map...
    </div>
  ),
});

interface RecentItemsListProps {
  items: StoredItemReport[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  isLive?: boolean;
  onFindMatches?: (item: StoredItemReport) => void;
  onClaimItem?: (item: StoredItemReport) => void;
  externalSearch?: string;
  externalCategory?: string;
  externalType?: "all" | "lost" | "found";
  externalViewMode?: "grid" | "map";
}

export default function RecentItemsList({
  items,
  isLoading = false,
  error = null,
  onRefresh,
  isLive = false,
  onFindMatches,
  onClaimItem,
  externalSearch,
  externalCategory,
  externalType,
  externalViewMode,
}: RecentItemsListProps) {
  const DEFAULT_PAGE_SIZE = 6;
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">(externalType || "all");
  const [searchQuery, setSearchQuery] = useState(externalSearch || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(externalCategory || "all");
  const [viewMode, setViewMode] = useState<"grid" | "map">(externalViewMode || "grid");
  const [visibleCount, setVisibleCount] = useState<number>(DEFAULT_PAGE_SIZE);

  // Synchronize if external filters change during render
  const [prevExternalSearch, setPrevExternalSearch] = useState(externalSearch);
  if (externalSearch !== prevExternalSearch) {
    setPrevExternalSearch(externalSearch);
    if (externalSearch !== undefined) setSearchQuery(externalSearch);
  }

  const [prevExternalCategory, setPrevExternalCategory] = useState(externalCategory);
  if (externalCategory !== prevExternalCategory) {
    setPrevExternalCategory(externalCategory);
    if (externalCategory !== undefined) setSelectedCategory(externalCategory);
  }

  const [prevExternalType, setPrevExternalType] = useState(externalType);
  if (externalType !== prevExternalType) {
    setPrevExternalType(externalType);
    if (externalType !== undefined) setFilterType(externalType);
  }

  const [prevExternalViewMode, setPrevExternalViewMode] = useState(externalViewMode);
  if (externalViewMode !== prevExternalViewMode) {
    setPrevExternalViewMode(externalViewMode);
    if (externalViewMode !== undefined) setViewMode(externalViewMode);
  }

  // Reset pagination count when filter, search, or category changes during render
  const filterKey = `${searchQuery}|${selectedCategory}|${filterType}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(DEFAULT_PAGE_SIZE);
  }

  const getLocationName = (locationIdOrName?: string) => {
    if (!locationIdOrName) return "";
    return (
      CAMPUS_LOCATIONS.find((l) => l.id === locationIdOrName)?.name ||
      locationIdOrName
    );
  };

  const filteredItems = items.filter((item) => {
    const itemType = (item.type || item.reportType || "lost").toLowerCase();
    const matchesType = filterType === "all" || itemType === filterType;
    
    const q = searchQuery.toLowerCase().trim();
    const locZone = item.location?.campusZone || getLocationName(item.campusLocation) || "";
    const locSpot = item.location?.specificLocation || item.specificLocation || "";

    const matchesSearch =
      q === "" ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.primaryColor && item.primaryColor.toLowerCase().includes(q)) ||
      locZone.toLowerCase().includes(q) ||
      locSpot.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesType && matchesSearch && matchesCategory;
  });

  const displayedItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;



  const getCategoryFallbackIcon = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case "electronics":
        return <Laptop className="w-6 h-6 text-[#A9B0AA]" />;
      case "id_cards":
        return <CreditCard className="w-6 h-6 text-[#A9B0AA]" />;
      case "books_notes":
        return <BookOpen className="w-6 h-6 text-[#A9B0AA]" />;
      case "bags_wallets":
        return <Briefcase className="w-6 h-6 text-[#A9B0AA]" />;
      case "bottles_accessories":
        return <Coffee className="w-6 h-6 text-[#A9B0AA]" />;
      case "keys":
        return <Key className="w-6 h-6 text-[#A9B0AA]" />;
      case "clothing":
        return <Shirt className="w-6 h-6 text-[#A9B0AA]" />;
      default:
        return <Tag className="w-6 h-6 text-[#A9B0AA]" />;
    }
  };

  const CATEGORY_PILLS = [
    { id: "all", label: "All Items" },
    { id: "electronics", label: "Electronics" },
    { id: "bags_wallets", label: "Wallets & Bags" },
    { id: "id_cards", label: "ID Cards & Docs" },
    { id: "keys", label: "Keys" },
    { id: "books_notes", label: "Books & Notes" },
    { id: "bottles_accessories", label: "Accessories" },
    { id: "clothing", label: "Clothing" },
  ];

  return (
    <section id="recent-items" className="relative w-full max-w-7xl mx-auto pt-6 px-4 sm:px-6">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-[#45B58A]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Section Header with Integrated Compact Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#2C342E]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#1C221E] text-[#C4CBC5] border border-[#313A33]">
              Sylhet Metropolitan Network
            </span>
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/35">
                <span className="w-1.5 h-1.5 rounded-full bg-[#45B58A] animate-pulse" />
                Live Database ({items.length})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1C221E] text-[#A2ABA4] border border-[#313A33]">
                <Database className="w-3 h-3 text-[#A2ABA4]" />
                Local Mode
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F3F4EF] mt-1.5">
            Recent Lost &amp; Found Reports
          </h2>
          <p className="text-xs sm:text-sm text-[#C4CBC5] mt-1">
            Browse verified community reports across campuses, transit hubs, and city centers.
          </p>
        </div>

        {/* Compact Integrated Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Dedicated Clean Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#A2ABA4] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, brands, places..."
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-[#313A33] bg-[#1C221E] text-xs text-[#F3F4EF] placeholder:text-[#9EA8A0] focus:outline-none focus:border-[#45B58A] transition shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A2ABA4] hover:text-[#F3F4EF] cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Lost / Found Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#1C221E] rounded-xl border border-[#313A33]">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterType === "all"
                  ? "bg-[#29332B] text-[#F3F4EF] shadow-xs"
                  : "text-[#A2ABA4] hover:text-[#F3F4EF]"
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterType("lost")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterType === "lost"
                  ? "bg-[#29332B] text-[#F3F4EF] border border-[#3A453D] font-bold"
                  : "text-[#A2ABA4] hover:text-[#F3F4EF]"
              }`}
            >
              Lost ({items.filter((i) => (i.type || i.reportType) === "lost").length})
            </button>
            <button
              onClick={() => setFilterType("found")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterType === "found"
                  ? "bg-[#45B58A] text-[#141715] font-bold shadow-xs"
                  : "text-[#A2ABA4] hover:text-[#45B58A]"
              }`}
            >
              Found ({items.filter((i) => (i.type || i.reportType) === "found").length})
            </button>
          </div>

          {/* View Mode: Grid vs Sylhet Map */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 p-1 bg-[#252B27] rounded-xl border border-[#383E39]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#383E39] text-[#F3F4EF] shadow-xs"
                    : "text-[#A9B0AA] hover:text-[#F3F4EF]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === "map"
                    ? "bg-[#45B58A] text-[#171A18] font-bold shadow-xs"
                    : "text-[#A9B0AA] hover:text-[#F3F4EF]"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Map
              </button>
            </div>

            <Link
              href="/map"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#383E39] bg-[#252B27] hover:border-[#45B58A]/50 text-xs font-semibold text-[#F3F4EF] transition active:scale-95"
              title="Open full-screen interactive Sylhet map"
            >
              <MapPin className="w-3.5 h-3.5 text-[#45B58A]" />
              <span>Fullscreen Map</span>
              <ArrowRight className="w-3 h-3 text-[#A9B0AA]" />
            </Link>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh reports"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#383E39] bg-[#252B27] text-xs font-semibold text-[#A9B0AA] hover:text-[#F3F4EF] transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#45B58A]" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Error state notification if backend is offline */}
      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-[#252B27] border border-[#383E39] text-[#A9B0AA] text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#A9B0AA] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#F3F4EF]">Live Backend Notice:</span>
              <p className="mt-0.5 text-[#A9B0AA]">{error}</p>
              <p className="mt-1 text-[11px] text-[#A9B0AA]">
                Displaying local preview data.
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1 bg-[#383E39] hover:bg-[#4a524b] text-[#F3F4EF] rounded-lg font-medium text-xs shrink-0 transition"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Modern Category Quick-Filter Bar (Clean Pills) */}
      <div className="mt-4 space-y-2.5">
        {searchQuery && (
          <div className="flex items-center justify-between p-2 px-3 bg-[#252B27] border border-[#383E39] rounded-xl text-xs text-[#A9B0AA]">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#45B58A]" />
              <span>
                Matching query: <strong className="font-bold text-[#F3F4EF]">&ldquo;{searchQuery}&rdquo;</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#171A18] hover:bg-[#383E39] text-[#A9B0AA] hover:text-[#F3F4EF] font-semibold border border-[#383E39] transition cursor-pointer text-[11px]"
            >
              <X className="w-3 h-3" />
              Clear Filter
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORY_PILLS.map((pill) => {
              const count =
                pill.id === "all"
                  ? items.length
                  : items.filter((it) => it.category === pill.id).length;
              const isSelected = selectedCategory === pill.id;

              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedCategory(pill.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#45B58A] text-[#141715] font-bold shadow-md shadow-[#45B58A]/20"
                      : "bg-[#1C221E] text-[#C4CBC5] border border-[#313A33] hover:border-[#45B58A]/50 hover:text-[#F3F4EF]"
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-[#141715]/20 text-[#141715]" : "bg-[#141715] text-[#A2ABA4]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs font-medium text-[#A9B0AA] shrink-0 hidden md:block">
            Showing <strong className="text-[#F3F4EF]">{Math.min(visibleCount, filteredItems.length)}</strong> of <strong className="text-[#F3F4EF]">{filteredItems.length}</strong> reports
          </span>
        </div>
      </div>

      {/* Feed Content: Interactive Campus Map View OR Responsive Grid Cards */}
      {viewMode === "map" ? (
        <div className="mt-6">
          <CampusMapView
            items={filteredItems}
            onFindMatches={onFindMatches}
            onClaimItem={onClaimItem}
          />
        </div>
      ) : isLoading && items.length === 0 ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-[#383E39] bg-[#252B27] p-4 animate-pulse space-y-3">
              <div className="h-44 bg-[#171A18] rounded-xl" />
              <div className="h-4 bg-[#171A18] rounded w-3/4" />
              <div className="h-3 bg-[#171A18] rounded w-1/2" />
              <div className="h-10 bg-[#171A18] rounded" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-8 p-12 text-center rounded-2xl border border-[#383E39] bg-[#252B27]">
          <HelpCircle className="w-10 h-10 text-[#A9B0AA] mx-auto mb-3" />
          <h4 className="text-base font-semibold text-[#F3F4EF]">No matching reports found</h4>
          <p className="text-xs text-[#A9B0AA] mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting another category, or submit a new report.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setFilterType("all");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171A18] hover:bg-[#383E39] text-[#F3F4EF] font-semibold text-xs border border-[#383E39] transition cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedItems.map((item) => {
              const isLost = (item.type || item.reportType) === "lost";
              const rawUrl =
                (item.imageUrls && item.imageUrls.length > 0 && item.imageUrls[0]) ||
                (item.images && item.images.length > 0 && item.images[0].previewUrl) ||
                null;
              const imageUrl = resolveImageUrl(rawUrl);

              const campusZone =
                item.location?.campusZone ||
                getLocationName(item.campusLocation);

              const displayId = item._id || item.id;

              return (
                <div
                  key={displayId}
                  className="group rounded-2xl border border-[#313A33] bg-[#1C221E] hover:bg-[#202722] hover:border-[#45B58A]/60 transition-all duration-300 shadow-md shadow-black/30 hover:shadow-2xl hover:shadow-[#45B58A]/10 hover:-translate-y-1 overflow-hidden flex flex-col"
                >
                  {/* Clean Visual Preview */}
                  <div className="relative h-44 bg-[#141715] overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-[#141715] border-b border-[#2C342E]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1F2621] text-[#C4CBC5] border border-[#313A33]">
                            {item.category?.replace("_", " ")}
                          </span>
                          {item.brand && (
                            <span className="text-[10px] text-[#C4CBC5] bg-[#1F2621] px-1.5 py-0.5 rounded border border-[#313A33]">
                              {item.brand}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 my-auto">
                          <div className="p-3 rounded-xl bg-[#1C221E] text-[#45B58A] border border-[#313A33]">
                            {getCategoryFallbackIcon(item.category)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-[#F3F4EF] line-clamp-1">
                              {item.title}
                            </p>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#A2ABA4] flex items-center justify-between pt-1 border-t border-[#2C342E]">
                          <span>Color: {item.primaryColor || "Standard"}</span>
                        </div>
                      </div>
                    )}

                    {/* Status Pill Overlay */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm ${
                          isLost
                            ? "bg-[#141715]/90 text-[#F3F4EF] border border-[#313A33]"
                            : "bg-[#45B58A] text-[#141715]"
                        }`}
                      >
                        {isLost ? "Lost" : "Found"}
                      </span>
                    </div>

                    {/* Category Tag Overlay (Top Right) */}
                    <span className="absolute top-2.5 right-2.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#141715]/85 text-[#C4CBC5] border border-[#313A33]">
                      {(item.category || "item").replace("_", " ")}
                    </span>
                  </div>

                  {/* Concise, Eye-Catching Content Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Punchy 1-line Title */}
                      <h4 className="text-sm font-semibold text-[#F3F4EF] line-clamp-1 group-hover:text-[#45B58A] transition">
                        {item.title}
                      </h4>

                      {/* Concise 1-line Feature / Distinct Mark */}
                      {item.uniqueMarks ? (
                        <p className="text-[11px] text-[#C4CBC5] truncate mt-1">
                          <span className="text-[#45B58A] font-semibold">Distinct:</span> {item.uniqueMarks}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#C4CBC5] truncate mt-1">
                          {item.brand ? `${item.brand} • ` : ""}{item.primaryColor || "Standard"}
                        </p>
                      )}
                    </div>

                    {/* Single-Line Location & Time Row */}
                    <div>
                      <div className="mt-3 pt-2.5 border-t border-[#2A322C] flex items-center justify-between text-[11px] text-[#B8C0B9]">
                        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                          <MapPin className="w-3.5 h-3.5 text-[#45B58A] shrink-0" />
                          <span className="truncate">{campusZone || "Sylhet"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] shrink-0">
                          <Clock className="w-3 h-3 text-[#A9B0AA]" />
                          <span>
                            {item.dateTime
                              ? String(item.dateTime).replace("T", " ").slice(5, 16)
                              : "Recent"}
                          </span>
                        </div>
                      </div>

                      {/* Actions: Emerald for Primary Action */}
                      {isLost && onFindMatches && (
                        <button
                          type="button"
                          onClick={() => onFindMatches(item)}
                          className="mt-3 w-full py-2 px-3 rounded-xl bg-[#141715] hover:bg-[#252E27] text-[#F3F4EF] border border-[#313A33] hover:border-[#45B58A]/60 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#45B58A]" />
                          Check Matching Items
                        </button>
                      )}

                      {!isLost && item.status === "claimed" && (
                        <div className="mt-3 w-full py-2 px-3 rounded-xl bg-[#141715] text-[#C4CBC5] font-semibold text-xs flex items-center justify-center gap-1.5 border border-[#313A33]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#45B58A]" />
                          Claimed &amp; Verified
                        </div>
                      )}

                      {!isLost && item.status !== "claimed" && onClaimItem && (
                        <button
                          type="button"
                          onClick={() => onClaimItem(item)}
                          className="mt-3 w-full py-2 px-3 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#141715] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-[#45B58A]/15 cursor-pointer active:scale-98"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Claim This Item
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Pagination Control */}
          {filteredItems.length > DEFAULT_PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#2C342E]">
              <div className="text-xs text-[#C4CBC5] font-medium">
                Showing <strong className="text-[#F3F4EF]">{displayedItems.length}</strong> of{" "}
                <strong className="text-[#F3F4EF]">{filteredItems.length}</strong> reports
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/explore"
                  className="px-4 py-2.5 rounded-xl bg-[#1C221E] hover:bg-[#252E27] text-[#F3F4EF] border border-[#313A33] font-semibold text-xs transition active:scale-95 flex items-center gap-1.5 shadow-xs"
                >
                  <span>Full Explorer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#45B58A]" />
                </Link>

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 6, filteredItems.length))}
                    className="px-5 py-2.5 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#141715] font-bold text-xs shadow-md shadow-[#45B58A]/15 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Load More Reports</span>
                  </button>
                )}

                {visibleCount > DEFAULT_PAGE_SIZE && (
                  <button
                    type="button"
                    onClick={() => {
                      setVisibleCount(DEFAULT_PAGE_SIZE);
                      document.getElementById("recent-items")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-[#313A33] bg-[#1C221E] hover:bg-[#252E27] text-[#C4CBC5] hover:text-[#F3F4EF] font-semibold text-xs transition cursor-pointer"
                  >
                    Show Less
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
