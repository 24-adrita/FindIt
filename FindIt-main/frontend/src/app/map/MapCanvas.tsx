"use client";

import React, { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker, PopupEvent } from "leaflet";
import { StoredItemReport, CAMPUS_LOCATIONS } from "../../types/item";
import { resolveImageUrl } from "../../services/api";

interface MapCanvasProps {
  items: StoredItemReport[];
  focusedItemId?: string | null;
  onFindMatches?: (item: StoredItemReport) => void;
  onClaimItem?: (item: StoredItemReport) => void;
  selectedZone?: string;
  onSelectZone?: (zoneId: string) => void;
}

// Sylhet City Center coordinates (Surma Bridge / Zindabazar hub)
const SYLHET_METRO_CENTER: [number, number] = [24.896, 91.905];

export default function MapCanvas({
  items,
  focusedItemId,
  onFindMatches,
  onClaimItem,
  selectedZone = "all",
  onSelectZone,
}: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersMapRef = useRef<{ [key: string]: { marker: LeafletMarker; latLng: [number, number] } }>({});

  useEffect(() => {
    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Leaflet map
      const map = L.map(mapContainerRef.current, {
        center: SYLHET_METRO_CENTER,
        zoom: 13,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Add dark / stylish OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | FindIt Sylhet',
        maxZoom: 19,
      }).addTo(map);

      // Add campus & hub zone circles
      CAMPUS_LOCATIONS.forEach((loc) => {
        if (!loc.lat || !loc.lng) return;

        const zoneCircle = L.circle([loc.lat, loc.lng], {
          color: "#06b6d4",
          fillColor: "#0891b2",
          fillOpacity: 0.15,
          radius: 120,
          weight: 1.5,
          dashArray: "4, 4",
        }).addTo(map);

        zoneCircle.bindTooltip(
          `🏢 <b>${loc.name}</b><br/><span style="font-size:10px;color:#94a3b8;">${loc.zone}</span>`,
          {
            permanent: false,
            direction: "top",
          }
        );
      });

      // Markers store
      const markersObj: { [key: string]: { marker: LeafletMarker; latLng: [number, number] } } = {};
      const validPoints: [number, number][] = [];
      const locationCounts: { [key: string]: number } = {};

      items.forEach((item) => {
        const itemType = (item.type || item.reportType || "lost").toLowerCase();
        const isLost = itemType === "lost";
        const locId = item.campusLocation || item.location?.campusZone || "other";
        const campusLoc =
          CAMPUS_LOCATIONS.find(
            (l) => l.id === locId || l.name.toLowerCase().includes(locId.toLowerCase())
          ) || CAMPUS_LOCATIONS[CAMPUS_LOCATIONS.length - 1];

        const baseLat = campusLoc.lat || SYLHET_METRO_CENTER[0];
        const baseLng = campusLoc.lng || SYLHET_METRO_CENTER[1];

        // Tiny jitter for overlapping points
        const count = locationCounts[campusLoc.id] || 0;
        locationCounts[campusLoc.id] = count + 1;
        const angle = count * 1.25;
        const radius = count > 0 ? 0.00022 * Math.sqrt(count) : 0;
        const itemLat = baseLat + radius * Math.cos(angle);
        const itemLng = baseLng + radius * Math.sin(angle);
        validPoints.push([itemLat, itemLng]);

        const markerBg = isLost ? "#f43f5e" : "#10b981";
        const markerBorder = isLost ? "#be123c" : "#047857";
        const markerSymbol = isLost ? "🔍" : "🎁";
        const typeLabel = isLost ? "LOST ITEM" : "FOUND ITEM";
        const typeBadgeColor = isLost
          ? "background:#ffe4e6;color:#be123c;"
          : "background:#d1fae5;color:#065f46;";

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
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                border: 2px solid white;
                font-size: 13px;
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

        const rawUrl =
          (item.imageUrls && item.imageUrls[0]) ||
          (item.images && item.images[0]?.previewUrl) ||
          null;
        const imageUrl = resolveImageUrl(rawUrl);

        const imageHtml = imageUrl
          ? `<div style="width: 100%; height: 110px; overflow: hidden; border-radius: 8px; margin-bottom: 8px; background: #0f172a;">
               <img src="${imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
             </div>`
          : "";

        const actionBtnHtml = isLost
          ? `<button class="btn-map-matches" data-item-id="${item._id || item.id}" style="
               display: flex;
               align-items: center;
               justify-content: center;
               gap: 6px;
               width: 100%;
               padding: 7px 12px;
               margin-top: 8px;
               border-radius: 8px;
               background: #0f172a;
               color: #38bdf8;
               border: 1px solid #0284c7;
               font-weight: 700;
               font-size: 11px;
               cursor: pointer;
             ">
               ✨ Check AI Matches
             </button>`
          : `<button class="btn-map-claim" data-item-id="${item._id || item.id}" style="
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
               font-weight: 700;
               font-size: 11px;
               border: none;
               cursor: pointer;
             ">
               🛡️ Claim This Item
             </button>`;

        const popupContent = `
          <div style="font-family: inherit; min-width: 180px; max-width: 230px;">
            ${imageHtml}
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="${typeBadgeColor} font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
                ${typeLabel}
              </span>
              <span style="font-size: 10px; color: #64748b; font-weight: 600;">
                ${item.category || "General"}
              </span>
            </div>
            <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 2px 0 4px 0; line-height: 1.3;">
              ${item.title}
            </h4>
            <div style="font-size: 10px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
              📍 <b>${campusLoc.name}</b>
              ${item.specificLocation ? `<br/>📌 ${item.specificLocation}` : ""}
            </div>
            ${actionBtnHtml}
          </div>
        `;

        const marker = L.marker([itemLat, itemLng], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent, { maxWidth: 240 });

        const itemId = item._id || item.id;
        markersObj[itemId] = { marker, latLng: [itemLat, itemLng] };
      });

      markersMapRef.current = markersObj;

      // Fit bounds
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }

      // Delegate popup clicks
      map.on("popupopen", (e: PopupEvent) => {
        const popupEl = e.popup.getElement();
        if (!popupEl) return;

        const matchBtn = popupEl.querySelector(".btn-map-matches");
        if (matchBtn) {
          matchBtn.addEventListener("click", () => {
            const id = matchBtn.getAttribute("data-item-id");
            const target = items.find((i) => (i._id || i.id) === id);
            if (target && onFindMatches) onFindMatches(target);
          });
        }

        const claimBtn = popupEl.querySelector(".btn-map-claim");
        if (claimBtn) {
          claimBtn.addEventListener("click", () => {
            const id = claimBtn.getAttribute("data-item-id");
            const target = items.find((i) => (i._id || i.id) === id);
            if (target && onClaimItem) onClaimItem(target);
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
  }, [items, onFindMatches, onClaimItem]);

  // Focus and pan to specific item when selected from list
  useEffect(() => {
    if (!focusedItemId || !mapInstanceRef.current) return;
    const itemData = markersMapRef.current[focusedItemId];
    if (itemData) {
      mapInstanceRef.current.flyTo(itemData.latLng, 16, { duration: 1.2 });
      setTimeout(() => {
        itemData.marker.openPopup();
      }, 1200);
    }
  }, [focusedItemId]);

  // Pan when zone is changed
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedZone || selectedZone === "all") return;
    const loc = CAMPUS_LOCATIONS.find((l) => l.id === selectedZone);
    if (loc && loc.lat && loc.lng) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 15, { duration: 1 });
    }
  }, [selectedZone]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(SYLHET_METRO_CENTER, 13, { duration: 1 });
      if (onSelectZone) onSelectZone("all");
    }
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Quick Zone Chips Bar on Bottom of Map */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 max-w-[92%] flex items-center gap-2 overflow-x-auto p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-2xl">
        <button
          type="button"
          onClick={handleResetView}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 whitespace-nowrap transition cursor-pointer"
        >
          🎯 Sylhet Center
        </button>
        {CAMPUS_LOCATIONS.slice(0, 4).map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => {
              if (onSelectZone) onSelectZone(loc.id);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedZone === loc.id
                ? "bg-indigo-600 text-white font-bold"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            {loc.name.split(" ")[0]} {loc.zone}
          </button>
        ))}
      </div>
    </div>
  );
}
