"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import MatchesModal from "../../components/MatchesModal";
import ClaimModal from "../../components/ClaimModal";
import AuthModal from "../../components/AuthModal";
import WeightsModal from "../../components/WeightsModal";
import { SAMPLE_CAMPUS_ITEMS } from "../../data/sampleItems";
import { StoredItemReport, CAMPUS_LOCATIONS } from "../../types/item";
import { fetchItems, resolveImageUrl } from "../../services/api";
import {
  Search,
  MapPin,
  Clock,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Map as MapIcon,
  SlidersHorizontal,
  ChevronRight,
  Compass,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "electronics", label: "Electronics" },
  { id: "bags_wallets", label: "Wallets & Bags" },
  { id: "id_cards", label: "ID Cards & Docs" },
  { id: "keys", label: "Keys" },
  { id: "books_notes", label: "Books & Notes" },
  { id: "bottles_accessories", label: "Accessories" },
  { id: "clothing", label: "Clothing" },
];

export default function ExplorePage() {
  const [items, setItems] = useState<StoredItemReport[]>(SAMPLE_CAMPUS_ITEMS);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [reportType, setReportType] = useState<"all" | "lost" | "found">("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  // Pagination
  const ITEMS_PER_PAGE = 9;
  const [currentPage, setCurrentPage] = useState(1);

  // Adjust pagination when filters change during render
  const filterKey = `${searchQuery}|${selectedCategory}|${reportType}|${selectedLocation}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  // Modals
  const [selectedLostItem, setSelectedLostItem] = useState<StoredItemReport | null>(null);
  const [claimItem, setClaimItem] = useState<StoredItemReport | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [isWeightsOpen, setIsWeightsOpen] = useState(false);

  // Re-fetch items after claim submission or refresh
  const loadItems = useCallback(async () => {
    try {
      const data = await fetchItems();
      if (data && data.length > 0) {
        setItems(data);
      }
    } catch (err: unknown) {
      console.warn("Using sample items for explorer:", err);
    }
  }, []);

  // Fetch real items on mount
  useEffect(() => {
    let isMounted = true;
    fetchItems()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setItems(data);
        }
      })
      .catch((err: unknown) => {
        console.warn("Using sample items for explorer:", err);
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

  // Filter items
  const filteredItems = items.filter((item) => {
    const itemType = (item.type || item.reportType || "lost").toLowerCase();
    if (reportType !== "all" && itemType !== reportType) return false;

    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

    const locZone = item.location?.campusZone || getLocationName(item.campusLocation) || "";
    const locSpot = item.location?.specificLocation || item.specificLocation || "";
    const itemCampusId = item.campusLocation || "";

    if (
      selectedLocation !== "all" &&
      itemCampusId !== selectedLocation &&
      !locZone.toLowerCase().includes(selectedLocation.toLowerCase())
    ) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      const matches =
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.primaryColor && item.primaryColor.toLowerCase().includes(q)) ||
        locZone.toLowerCase().includes(q) ||
        locSpot.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setReportType("all");
    setSelectedLocation("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    reportType !== "all" ||
    selectedLocation !== "all";

  return (
    <div className="min-h-screen flex flex-col bg-[#171A18] text-[#F3F4EF] selection:bg-[#45B58A] selection:text-[#171A18]">
      {/* Navigation Header */}
      <Navbar
        onOpenWeights={() => setIsWeightsOpen(true)}
        onOpenAuth={(tab) => {
          setAuthModalTab(tab);
          setAuthModalOpen(true);
        }}
      />

      {/* Hero Sub-header / Explorer Banner */}
      <div className="border-b border-[#383E39] bg-[#171A18] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#A9B0AA]">
              <Link href="/" className="hover:text-[#45B58A] transition">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#383E39]" />
              <span className="text-[#45B58A] font-semibold">Catalog Explorer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F4EF] flex items-center gap-2.5">
              <span>Sylhet Lost &amp; Found Explorer</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#45B58A]/10 text-[#45B58A] border border-[#45B58A]/30">
                {filteredItems.length} Reports
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#A9B0AA] max-w-2xl">
              Search and filter community lost &amp; found belongings across Metropolitan University, SUST, and metropolitan transit points.
            </p>
          </div>

          {/* Quick Switch to Map View */}
          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#252B27] hover:bg-[#383E39] text-[#F3F4EF] border border-[#383E39] text-xs font-semibold transition active:scale-95 hover:border-[#45B58A]/50"
            >
              <MapIcon className="w-4 h-4 text-[#45B58A]" />
              <span>Switch to Map View</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#A9B0AA]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Explorer Workspace: Sidebar Filters + Main Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Filter Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="p-5 rounded-2xl bg-[#252B27] border border-[#383E39] space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-[#383E39]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F3F4EF] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#45B58A]" />
                  Filters
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[11px] font-semibold text-[#A9B0AA] hover:text-[#F3F4EF] transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Keyword Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#F3F4EF]">Keyword Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#A9B0AA] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, brand, spot..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#171A18] border border-[#383E39] text-xs text-[#F3F4EF] placeholder-[#A9B0AA] focus:outline-none focus:border-[#45B58A] transition"
                  />
                </div>
              </div>

              {/* Report Type (All / Lost / Found) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#F3F4EF]">Report Type</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#171A18] rounded-xl border border-[#383E39]">
                  <button
                    type="button"
                    onClick={() => setReportType("all")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      reportType === "all"
                        ? "bg-[#383E39] text-[#F3F4EF] shadow-xs"
                        : "text-[#A9B0AA] hover:text-[#F3F4EF]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("lost")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      reportType === "lost"
                        ? "bg-[#383E39] text-[#F3F4EF] border border-[#383E39]"
                        : "text-[#A9B0AA] hover:text-[#F3F4EF]"
                    }`}
                  >
                    Lost
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("found")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      reportType === "found"
                        ? "bg-[#45B58A] text-[#171A18] font-bold"
                        : "text-[#A9B0AA] hover:text-[#45B58A]"
                    }`}
                  >
                    Found
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#F3F4EF]">Category</label>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {CATEGORIES.map((cat) => {
                    const count =
                      cat.id === "all"
                        ? items.length
                        : items.filter((i) => i.category === cat.id).length;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                          isSelected
                            ? "bg-[#45B58A] text-[#171A18] font-bold"
                            : "text-[#A9B0AA] hover:bg-[#171A18] hover:text-[#F3F4EF]"
                        }`}
                      >
                        <span className="truncate">{cat.label}</span>
                        <span className="text-[10px] font-mono opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sylhet Zone / Campus Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#F3F4EF]">Sylhet Location / Zone</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#171A18] border border-[#383E39] text-xs text-[#F3F4EF] focus:outline-none focus:border-[#45B58A] cursor-pointer"
                >
                  <option value="all">All Locations in Sylhet</option>
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.zone})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Right Column: Items Grid & Results Header */}
          <main className="lg:col-span-3 space-y-6">
            {/* Top Toolbar / Active Filter Badges */}
            <div className="p-4 rounded-2xl bg-[#252B27] border border-[#383E39] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#A9B0AA]">
                <span>Showing</span>
                <strong className="text-[#F3F4EF]">
                  {filteredItems.length === 0
                    ? 0
                    : `${(currentPage - 1) * ITEMS_PER_PAGE + 1} - ${Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        filteredItems.length
                      )}`}
                </strong>
                <span>of</span>
                <strong className="text-[#F3F4EF]">{filteredItems.length}</strong>
                <span>results</span>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {reportType !== "all" && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#171A18] text-[#F3F4EF] border border-[#383E39] capitalize">
                      {reportType}
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#171A18] text-[#F3F4EF] border border-[#383E39] capitalize">
                      {selectedCategory.replace("_", " ")}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#45B58A]/10 text-[#45B58A] border border-[#45B58A]/30">
                      &quot;{searchQuery}&quot;
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#252B27] border border-[#383E39] space-y-4">
                <HelpCircle className="w-12 h-12 text-[#A9B0AA] mx-auto" />
                <h3 className="text-lg font-semibold text-[#F3F4EF]">No Matching Reports Found</h3>
                <p className="text-xs text-[#A9B0AA] max-w-sm mx-auto">
                  Try adjusting your search keywords, clearing location filters, or resetting category selections.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-[#171A18] hover:bg-[#383E39] text-[#F3F4EF] font-semibold text-xs border border-[#383E39] transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Items Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginatedItems.map((item) => {
                  const isLost = (item.type || item.reportType) === "lost";
                  const rawUrl =
                    (item.imageUrls && item.imageUrls.length > 0 && item.imageUrls[0]) ||
                    (item.images && item.images.length > 0 && item.images[0].previewUrl) ||
                    null;
                  const imageUrl = resolveImageUrl(rawUrl);
                  const campusZone =
                    item.location?.campusZone || getLocationName(item.campusLocation);
                  const displayId = item._id || item.id;

                  return (
                    <div
                      key={displayId}
                      className="group rounded-2xl bg-[#252B27] border border-[#383E39] hover:border-[#45B58A]/50 transition-all duration-200 overflow-hidden flex flex-col"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative h-44 bg-[#171A18] overflow-hidden flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full p-4 flex flex-col justify-between bg-[#171A18] border-b border-[#383E39]">
                            <span className="text-[10px] font-semibold uppercase text-[#A9B0AA]">
                              {item.category?.replace("_", " ")}
                            </span>
                            <div className="my-auto text-center">
                              <Compass className="w-8 h-8 text-[#383E39] mx-auto mb-1" />
                              <span className="text-xs font-semibold text-[#A9B0AA] line-clamp-1">
                                {item.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#A9B0AA]">No Photo Provided</span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isLost
                                ? "bg-[#171A18]/90 text-[#F3F4EF] border border-[#383E39]"
                                : "bg-[#45B58A] text-[#171A18]"
                            }`}
                          >
                            {isLost ? "Lost" : "Found"}
                          </span>
                        </div>

                        {/* Category Tag */}
                        <span className="absolute top-2.5 right-2.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#171A18]/85 text-[#A9B0AA] border border-[#383E39]">
                          {(item.category || "item").replace("_", " ")}
                        </span>
                      </div>

                      {/* Content Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-sm text-[#F3F4EF] line-clamp-1 group-hover:text-[#45B58A] transition">
                            {item.title}
                          </h3>

                          {item.uniqueMarks ? (
                            <p className="text-[11px] text-[#A9B0AA] truncate">
                              <span className="text-[#45B58A] font-medium">Distinct:</span> {item.uniqueMarks}
                            </p>
                          ) : (
                            <p className="text-[11px] text-[#A9B0AA] truncate">
                              {item.brand ? `${item.brand} • ` : ""}{item.primaryColor || "Standard"}
                            </p>
                          )}
                        </div>

                        {/* Location & Time Footer */}
                        <div>
                          <div className="pt-2 border-t border-[#383E39] flex items-center justify-between text-[11px] text-[#A9B0AA]">
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

                          {/* Action Buttons */}
                          {isLost && (
                            <button
                              type="button"
                              onClick={() => setSelectedLostItem(item)}
                              className="mt-3 w-full py-2 px-3 rounded-xl bg-[#171A18] hover:bg-[#252B27] text-[#F3F4EF] border border-[#383E39] hover:border-[#45B58A]/50 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#45B58A]" />
                              Check Matching Items
                            </button>
                          )}

                          {!isLost && item.status === "claimed" && (
                            <div className="mt-3 w-full py-2 px-3 rounded-xl bg-[#171A18] text-[#A9B0AA] font-semibold text-xs flex items-center justify-center gap-1.5 border border-[#383E39]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#45B58A]" />
                              Claimed &amp; Verified
                            </div>
                          )}

                          {!isLost && item.status !== "claimed" && (
                            <button
                              type="button"
                              onClick={() => setClaimItem(item)}
                              className="mt-3 w-full py-2 px-3 rounded-xl bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
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
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-[#383E39] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-[#252B27] border border-[#383E39] text-xs font-semibold text-[#F3F4EF] hover:bg-[#383E39] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  &larr; Previous Page
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-[#45B58A] text-[#171A18] font-bold"
                            : "bg-[#252B27] text-[#A9B0AA] hover:bg-[#383E39] border border-[#383E39]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl bg-[#252B27] border border-[#383E39] text-xs font-semibold text-[#F3F4EF] hover:bg-[#383E39] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next Page &rarr;
                </button>
              </div>
            )}
          </main>
        </div>
      </div>


      {/* Footer */}
      <Footer onOpenWeights={() => setIsWeightsOpen(true)} />

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
