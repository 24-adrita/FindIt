"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Map as LeafletMap, PopupEvent } from "leaflet";
import { StoredItemReport, CAMPUS_LOCATIONS } from "../types/item";
import { MapPin, Layers, Info } from "lucide-react";

interface CampusMapViewProps {
  items: StoredItemReport[];
  onFindMatches?: (item: StoredItemReport) => void;
  onClaimItem?: (item: StoredItemReport) => void;
}

// Sylhet Metropolitan City & Campus central coordinates (Zindabazar / Surma to Bateshwar)
const SYLHET_METRO_CENTER: [number, number] = [24.8960, 91.9050];

const emptySubscribe = () => () => {};

export default function CampusMapView({
  items,
  onFindMatches,
  onClaimItem,
}: CampusMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);



  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return;

    let isSubscribed = true;

    // Dynamically load Leaflet on the client side only
    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      // Clean up previous map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map with Sylhet City center
      const map = L.map(mapContainerRef.current, {
        center: SYLHET_METRO_CENTER,
        zoom: 13,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | Sylhet FindIt AI',
        maxZoom: 19,
      }).addTo(map);

      // Add building reference circles/polygons with labels
      CAMPUS_LOCATIONS.forEach((loc) => {
        if (!loc.lat || !loc.lng) return;

        const buildingCircle = L.circle([loc.lat, loc.lng], {
          color: "#6366f1",
          fillColor: "#e0e7ff",
          fillOpacity: 0.25,
          radius: 28,
          weight: 1.5,
          dashArray: "3, 3",
        }).addTo(map);

        buildingCircle.bindTooltip(`🏢 <b>${loc.name}</b><br><span style="font-size: 10px; color: #64748b;">${loc.zone}</span>`, {
          permanent: false,
          direction: "top",
          className: "campus-building-tooltip",
        });
      });

      // Group items by location to jitter overlapping markers slightly
      const locationCounts: { [key: string]: number } = {};
      const validPoints: [number, number][] = [];

      items.forEach((item) => {
        const itemType = item.type || item.reportType || "lost";
        const isLost = itemType === "lost";
        const locId = item.campusLocation || item.location?.campusZone || "other";
        const campusLoc = CAMPUS_LOCATIONS.find(
          (l) => l.id === locId || l.name.toLowerCase().includes(locId.toLowerCase())
        ) || CAMPUS_LOCATIONS[CAMPUS_LOCATIONS.length - 1]; // default to 'other'

        const baseLat = campusLoc.lat || SYLHET_METRO_CENTER[0];
        const baseLng = campusLoc.lng || SYLHET_METRO_CENTER[1];

        // Apply a tiny deterministic jitter if multiple items share the same building coordinate
        const count = locationCounts[campusLoc.id] || 0;
        locationCounts[campusLoc.id] = count + 1;
        const angle = count * 1.25;
        const radius = count > 0 ? 0.00018 * Math.sqrt(count) : 0;
        const itemLat = baseLat + radius * Math.cos(angle);
        const itemLng = baseLng + radius * Math.sin(angle);
        validPoints.push([itemLat, itemLng]);

        // Marker color and icon
        const markerBg = isLost ? "#ef4444" : "#10b981";
        const markerBorder = isLost ? "#b91c1c" : "#047857";
        const markerSymbol = isLost ? "🔍" : "🎁";
        const typeLabel = isLost ? "LOST ITEM" : "FOUND ITEM";
        const typeBadgeColor = isLost ? "background:#fee2e2;color:#991b1b;" : "background:#d1fae5;color:#065f46;";

        const customIcon = L.divIcon({
          className: "custom-map-pin",
          html: `
            <div style="position: relative; cursor: pointer;">
              <div style="
                background: ${markerBg};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                border: 2px solid white;
                font-size: 13px;
                transform: scale(1);
                transition: transform 0.2s;
              ">
                ${markerSymbol}
              </div>
              <div style="
                position: absolute;
                bottom: -4px;
                left: 12px;
                width: 8px;
                height: 8px;
                background: ${markerBorder};
                transform: rotate(45deg);
                border-radius: 1px;
              "></div>
            </div>
          `,
          iconSize: [32, 36],
          iconAnchor: [16, 36],
          popupAnchor: [0, -36],
        });

        // Determine image thumbnail
        const imageUrl =
          item.imageUrls?.[0] ||
          (item.images?.[0] ? item.images[0].previewUrl : null);

        const imageHtml = imageUrl
          ? `<div style="width: 100%; height: 110px; overflow: hidden; border-radius: 8px; margin-bottom: 8px; background: #f1f5f9;">
               <img src="${imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
             </div>`
          : "";

        const actionBtnHtml = isLost
          ? `<button class="btn-find-matches" data-item-id="${item._id || item.id}" style="
               display: flex;
               align-items: center;
               justify-content: center;
               gap: 6px;
               width: 100%;
               padding: 7px 12px;
               margin-top: 8px;
               border-radius: 8px;
               background: #4f46e5;
               color: white;
               font-weight: 600;
               font-size: 11px;
               border: none;
               cursor: pointer;
             ">
               ✨ Find AI Matches (5-Weight)
             </button>`
          : `<button class="btn-claim-item" data-item-id="${item._id || item.id}" style="
               display: flex;
               align-items: center;
               justify-content: center;
               gap: 6px;
               width: 100%;
               padding: 7px 12px;
               margin-top: 8px;
               border-radius: 8px;
               background: #059669;
               color: white;
               font-weight: 600;
               font-size: 11px;
               border: none;
               cursor: pointer;
             ">
               🛡️ Claim This Item
             </button>`;

        const popupContent = `
          <div style="font-family: inherit; width: 220px; padding: 2px;">
            ${imageHtml}
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="${typeBadgeColor} font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
                ${typeLabel}
              </span>
              <span style="font-size: 10px; color: #64748b; font-weight: 600;">
                ${item.category || "General"}
              </span>
            </div>
            <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 2px 0 4px 0; line-height: 1.3;">
              ${item.title}
            </h4>
            <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.3; max-height: 38px; overflow: hidden;">
              ${item.description}
            </p>
            <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 4px;">
              📍 <b>${campusLoc.name}</b><br/>
              ${item.specificLocation ? `📌 ${item.specificLocation}` : ""}
            </div>
            ${actionBtnHtml}
          </div>
        `;

        const marker = L.marker([itemLat, itemLng], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent, {
          maxWidth: 240,
          className: "findit-map-popup",
        });
      });

      // Auto-fit map bounds so all Sylhet city hubs and campus reports fit perfectly
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      // Handle popup action button clicks
      map.on("popupopen", (e: PopupEvent) => {
        const popupEl = e.popup.getElement();
        if (!popupEl) return;

        const matchBtn = popupEl.querySelector(".btn-find-matches");
        if (matchBtn) {
          matchBtn.addEventListener("click", () => {
            const itemId = matchBtn.getAttribute("data-item-id");
            const target = items.find((i) => (i._id || i.id) === itemId);
            if (target && onFindMatches) {
              onFindMatches(target);
            }
          });
        }

        const claimBtn = popupEl.querySelector(".btn-claim-item");
        if (claimBtn) {
          claimBtn.addEventListener("click", () => {
            const itemId = claimBtn.getAttribute("data-item-id");
            const target = items.find((i) => (i._id || i.id) === itemId);
            if (target && onClaimItem) {
              onClaimItem(target);
            }
          });
        }
      });
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items, mounted, onFindMatches, onClaimItem]);

  const handlePanToBuilding = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    if (!mapInstanceRef.current) return;

    if (buildingId === "all") {
      mapInstanceRef.current.flyTo(SYLHET_METRO_CENTER, 13, { duration: 1.2 });
    } else {
      const loc = CAMPUS_LOCATIONS.find((l) => l.id === buildingId);
      if (loc && loc.lat && loc.lng) {
        mapInstanceRef.current.flyTo([loc.lat, loc.lng], 16, { duration: 1.2 });
      }
    }
  };

  const lostCount = items.filter((i) => (i.type || i.reportType) === "lost").length;
  const foundCount = items.filter((i) => (i.type || i.reportType) === "found").length;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Map Control Bar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Sylhet Metropolitan Area &amp; Campus Map
            </h3>
            <p className="text-xs text-slate-500">
              Interactive OpenStreetMap visualization of lost and found reports across Sylhet
            </p>
          </div>
        </div>

        {/* Quick Hub Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">Jump to Hub:</span>
          <select
            value={selectedBuilding}
            onChange={(e) => handlePanToBuilding(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="all">📍 Full Sylhet &amp; Campus View</option>
            {CAMPUS_LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                📍 {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[480px] sm:h-[540px] bg-slate-100">
        {!mounted ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            Loading interactive Sylhet map...
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        )}

        {/* Floating Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-xs px-3 py-2.5 rounded-xl border border-slate-200 shadow-md flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-xs inline-block" />
            <span className="font-medium text-slate-600">Lost Items ({lostCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-xs inline-block" />
            <span className="font-medium text-slate-600">Found Items ({foundCount})</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 border-l border-slate-200 pl-2">
            <span className="text-[11px] font-semibold">📍 Sylhet City &amp; Campus Hubs ({CAMPUS_LOCATIONS.length})</span>
          </div>
        </div>

        {/* Tip Badge */}
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs text-[11px] text-slate-600 flex items-center gap-1 hidden md:flex">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          Click any pin to inspect item &amp; take action
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
        <span>Sylhet Metropolitan Area coverage (Amberkhana, Zindabazar, Surma Riverfront, Bateshwar MU)</span>
        <span className="font-semibold text-slate-600">
          Total Mapped: {items.length} Reports
        </span>
      </div>
    </div>
  );
}
