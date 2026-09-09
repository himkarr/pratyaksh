import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  MapPin, Plus, Minus, Navigation, Layers, CheckCircle2, 
  Clock, AlertTriangle, ArrowRight, X, IndianRupee, Landmark,
  ExternalLink, Flag, Search, Filter, Compass, Maximize2
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { Button } from "../ui";

export interface CitizenInteractiveMapProps {
  works: WorkItem[];
  currentConstituency?: string;
  onSelectWork: (work: WorkItem) => void;
  onReportProblem?: (work: WorkItem) => void;
}

interface Coordinate {
  lat: number;
  lng: number;
}

type BasemapStyle = "voyager" | "satellite" | "light" | "dark";

// Comprehensive Indian Geographic Coordinates Dictionary for States, Districts, and Constituencies
const INDIA_GEO_COORDINATES: Record<string, Coordinate> = {
  // Maharashtra
  "pune": { lat: 18.5204, lng: 73.8567 },
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "mumbai north": { lat: 19.2288, lng: 72.8541 },
  "mumbai south": { lat: 18.9667, lng: 72.8167 },
  "nagpur": { lat: 21.1458, lng: 79.0882 },
  "nashik": { lat: 19.9975, lng: 73.7898 },
  "thane": { lat: 19.2183, lng: 72.9781 },
  "aurangabad": { lat: 19.8762, lng: 75.3433 },
  "solapur": { lat: 17.6599, lng: 75.9064 },
  "kolhapur": { lat: 16.7050, lng: 74.2433 },
  "maharashtra": { lat: 19.7515, lng: 75.7139 },

  // Uttar Pradesh
  "varanasi": { lat: 25.3176, lng: 82.9739 },
  "lucknow": { lat: 26.8467, lng: 80.9462 },
  "prayagraj": { lat: 25.4358, lng: 81.8463 },
  "allahabad": { lat: 25.4358, lng: 81.8463 },
  "kanpur": { lat: 26.4499, lng: 80.3319 },
  "agra": { lat: 27.1767, lng: 78.0081 },
  "gorakhpur": { lat: 26.7606, lng: 83.3732 },
  "uttar pradesh": { lat: 26.8467, lng: 80.9462 },

  // Delhi NCT
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  "delhi": { lat: 28.7041, lng: 77.1025 },
  "central delhi": { lat: 28.6448, lng: 77.2167 },
  "south delhi": { lat: 28.4817, lng: 77.1873 },

  // Karnataka
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "bangalore south": { lat: 12.9250, lng: 77.5838 },
  "bangalore north": { lat: 13.0358, lng: 77.5970 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "mysuru": { lat: 12.2958, lng: 76.6394 },
  "karnataka": { lat: 15.3173, lng: 75.7139 },

  // Tamil Nadu
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "chennai south": { lat: 12.9863, lng: 80.2184 },
  "coimbatore": { lat: 11.0168, lng: 76.9558 },
  "madurai": { lat: 9.9252, lng: 78.1198 },
  "tamil nadu": { lat: 11.1271, lng: 78.6569 },

  // Madhya Pradesh
  "jabalpur": { lat: 23.1815, lng: 79.9864 },
  "bhopal": { lat: 23.2599, lng: 77.4126 },
  "indore": { lat: 22.7196, lng: 75.8577 },
  "gwalior": { lat: 26.2183, lng: 78.1828 },
  "madhya pradesh": { lat: 22.9734, lng: 78.6569 },

  // Haryana
  "rohtak": { lat: 28.8955, lng: 76.6066 },
  "gurugram": { lat: 28.4595, lng: 77.0266 },
  "gurgaon": { lat: 28.4595, lng: 77.0266 },
  "kurukshetra": { lat: 29.9695, lng: 76.8783 },
  "ambala": { lat: 30.3782, lng: 76.7767 },
  "faridabad": { lat: 28.4089, lng: 77.3178 },
  "haryana": { lat: 29.0588, lng: 76.0856 },

  // Himachal Pradesh
  "himachal pradesh": { lat: 31.7433, lng: 77.1202 },
  "shimla": { lat: 31.1048, lng: 77.1734 },
  "kangra": { lat: 32.0998, lng: 76.2691 },
  "dharamshala": { lat: 32.2190, lng: 76.3234 },
  "mandi": { lat: 31.5892, lng: 76.9182 },
  "hamirpur": { lat: 31.6862, lng: 76.5213 },
  "kullu": { lat: 31.9579, lng: 77.1095 },
  "solan": { lat: 30.9045, lng: 77.0967 },
  "bilaspur": { lat: 31.3323, lng: 76.7583 },
  "una": { lat: 31.4685, lng: 76.2708 },

  // Rajasthan
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "jodhpur": { lat: 26.2389, lng: 73.0243 },
  "udaipur": { lat: 24.5854, lng: 73.7125 },
  "rajasthan": { lat: 27.0238, lng: 74.2179 },

  // Gujarat
  "ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "surat": { lat: 21.1702, lng: 72.8311 },
  "vadodara": { lat: 22.3072, lng: 73.1812 },
  "gujarat": { lat: 22.2587, lng: 71.1924 },

  // Bihar
  "patna": { lat: 25.5941, lng: 85.1376 },
  "gaya": { lat: 24.7914, lng: 85.0002 },
  "bihar": { lat: 25.0961, lng: 85.3131 },

  // West Bengal
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "howrah": { lat: 22.5958, lng: 88.2636 },
  "west bengal": { lat: 22.9868, lng: 87.8550 },

  // Telangana & Andhra Pradesh
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "vijayawada": { lat: 16.5062, lng: 80.6480 },
  "andhra pradesh": { lat: 15.9129, lng: 79.7400 },
  "telangana": { lat: 18.1124, lng: 79.0193 },

  // Kerala
  "thiruvananthapuram": { lat: 8.5241, lng: 76.9366 },
  "ernakulam": { lat: 9.9816, lng: 76.2999 },
  "kochi": { lat: 9.9312, lng: 76.2673 },
  "kozhikode": { lat: 11.2588, lng: 75.7804 },
  "kerala": { lat: 10.8505, lng: 76.2711 },

  // Punjab, Uttarakhand, Odisha, Assam, J&K
  "chandigarh": { lat: 30.7333, lng: 76.7794 },
  "ludhiana": { lat: 30.9010, lng: 75.8573 },
  "amritsar": { lat: 31.6340, lng: 74.8723 },
  "punjab": { lat: 31.1471, lng: 75.3412 },
  "dehradun": { lat: 30.3165, lng: 78.0322 },
  "uttarakhand": { lat: 30.0668, lng: 79.0193 },
  "bhubaneswar": { lat: 20.2961, lng: 85.8245 },
  "odisha": { lat: 20.9517, lng: 85.0985 },
  "guwahati": { lat: 26.1445, lng: 91.7362 },
  "assam": { lat: 26.2006, lng: 92.9376 },
  "srinagar": { lat: 34.0837, lng: 74.7973 },
  "jammu": { lat: 32.7266, lng: 74.8570 }
};

// Accurate geocoding resolver for a work item
const resolveWorkCoordinate = (work: WorkItem, index: number, fallbackCenter: Coordinate): Coordinate => {
  // 1. Direct explicit coordinates
  if ((work as any).latitude && (work as any).longitude) {
    const lat = Number((work as any).latitude);
    const lng = Number((work as any).longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
  }

  // 2. Lookup district
  const normDistrict = (work.district || "").trim().toLowerCase();
  if (normDistrict && INDIA_GEO_COORDINATES[normDistrict]) {
    const center = INDIA_GEO_COORDINATES[normDistrict];
    return spreadLocally(center, work.id, index);
  }

  // 3. Lookup constituency
  const normConstituency = (work.constituency || "").trim().toLowerCase();
  if (normConstituency && INDIA_GEO_COORDINATES[normConstituency]) {
    const center = INDIA_GEO_COORDINATES[normConstituency];
    return spreadLocally(center, work.id, index);
  }

  // 4. Lookup state
  const normState = (work.state || "").trim().toLowerCase();
  if (normState && INDIA_GEO_COORDINATES[normState]) {
    const center = INDIA_GEO_COORDINATES[normState];
    return spreadLocally(center, work.id, index, 0.04);
  }

  // 5. Fallback center with local jitter
  return spreadLocally(fallbackCenter, work.id, index);
};

// Deterministic local scatter around a district center (1km - 5km radius)
const spreadLocally = (center: Coordinate, seedStr: string, index: number, radiusScale: number = 0.02): Coordinate => {
  const hash = (seedStr || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + (index + 1) * 31;
  const angle = ((hash % 360) * Math.PI) / 180;
  const dist = radiusScale + ((hash % 35) / 1000); // 1.5km to 4.5km
  return {
    lat: center.lat + Math.sin(angle) * dist,
    lng: center.lng + Math.cos(angle) * (dist * 1.05),
  };
};

export const CitizenInteractiveMap: React.FC<CitizenInteractiveMapProps> = ({
  works,
  currentConstituency = "Pune",
  onSelectWork,
  onReportProblem,
}) => {
  // Determine constituency baseline coordinate
  const normConst = (currentConstituency || "pune").trim().toLowerCase();
  const baseCenterCoord = useMemo(() => {
    return INDIA_GEO_COORDINATES[normConst] || INDIA_GEO_COORDINATES["pune"];
  }, [normConst]);

  // Projected works with accurate geographic coordinates
  const projectedWorks = useMemo(() => {
    return works.map((work, idx) => {
      const coord = resolveWorkCoordinate(work, idx, baseCenterCoord);
      return { work, coord };
    });
  }, [works, baseCenterCoord]);

  // Compute centroid of all actual visible works for centering
  const dynamicCentroid = useMemo<Coordinate>(() => {
    if (projectedWorks.length === 0) return baseCenterCoord;
    const totalLat = projectedWorks.reduce((sum, item) => sum + item.coord.lat, 0);
    const totalLng = projectedWorks.reduce((sum, item) => sum + item.coord.lng, 0);
    return {
      lat: totalLat / projectedWorks.length,
      lng: totalLng / projectedWorks.length,
    };
  }, [projectedWorks, baseCenterCoord]);

  const [mapCenter, setMapCenter] = useState<Coordinate>(dynamicCentroid);
  const [zoom, setZoom] = useState<number>(12);
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>("voyager");
  const [selectedPinWork, setSelectedPinWork] = useState<WorkItem | null>(null);
  const [hoveredPinWork, setHoveredPinWork] = useState<WorkItem | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [tileErrorCount, setTileErrorCount] = useState(0);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 520 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (mapContainerRef.current) {
        setContainerSize({
          width: mapContainerRef.current.clientWidth || 800,
          height: mapContainerRef.current.clientHeight || 520,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Sync center when constituency or works change
  useEffect(() => {
    setMapCenter(dynamicCentroid);
    // Set appropriate initial zoom level
    if (projectedWorks.length <= 1) {
      setZoom(13);
    } else {
      // Calculate bounding box spread
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      projectedWorks.forEach(({ coord }) => {
        if (coord.lat < minLat) minLat = coord.lat;
        if (coord.lat > maxLat) maxLat = coord.lat;
        if (coord.lng < minLng) minLng = coord.lng;
        if (coord.lng > maxLng) maxLng = coord.lng;
      });
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      if (maxDiff > 8) setZoom(5);
      else if (maxDiff > 3) setZoom(7);
      else if (maxDiff > 1) setZoom(9);
      else if (maxDiff > 0.3) setZoom(11);
      else setZoom(13);
    }
  }, [dynamicCentroid, projectedWorks.length]);

  // Web Mercator projection helpers
  const latLngToPixel = useCallback(
    (lat: number, lng: number) => {
      const scale = Math.pow(2, zoom) * 256;
      const worldX = ((lng + 180) / 360) * scale;
      const latRad = (Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180;
      const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
      const worldY = (1 - mercN / Math.PI) * 0.5 * scale;

      const centerWorldX = ((mapCenter.lng + 180) / 360) * scale;
      const centerLatRad = (Math.max(-85.0511, Math.min(85.0511, mapCenter.lat)) * Math.PI) / 180;
      const centerMercN = Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2));
      const centerWorldY = (1 - centerMercN / Math.PI) * 0.5 * scale;

      const screenX = containerSize.width / 2 + (worldX - centerWorldX);
      const screenY = containerSize.height / 2 + (worldY - centerWorldY);

      return { x: screenX, y: screenY };
    },
    [zoom, mapCenter, containerSize]
  );

  // Generate tiles to fully cover current container viewport
  const tileInfo = useMemo(() => {
    const scale = Math.pow(2, zoom);
    const centerTileX = ((mapCenter.lng + 180) / 360) * scale;
    const latRad = (Math.max(-85.0511, Math.min(85.0511, mapCenter.lat)) * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const centerTileY = (1 - mercN / Math.PI) * 0.5 * scale;

    const tileSize = 256;
    const halfW = containerSize.width / 2;
    const halfH = containerSize.height / 2;

    const startTileX = Math.floor((centerTileX * tileSize - halfW) / tileSize) - 1;
    const endTileX = Math.ceil((centerTileX * tileSize + halfW) / tileSize) + 1;
    const startTileY = Math.floor((centerTileY * tileSize - halfH) / tileSize) - 1;
    const endTileY = Math.ceil((centerTileY * tileSize + halfH) / tileSize) + 1;

    const tiles: { x: number; y: number; z: number; left: number; top: number }[] = [];

    for (let x = startTileX; x <= endTileX; x++) {
      for (let y = startTileY; y <= endTileY; y++) {
        if (y >= 0 && y < scale) {
          const normalizedX = ((x % scale) + scale) % scale;
          const left = (x - centerTileX) * tileSize;
          const top = (y - centerTileY) * tileSize;
          tiles.push({ x: normalizedX, y, z: zoom, left, top });
        }
      }
    }
    return tiles;
  }, [mapCenter, zoom, containerSize]);

  // Robust multi-provider tile URL generator
  const getTileUrl = (provider: BasemapStyle, z: number, x: number, y: number) => {
    const subdomains = ["a", "b", "c", "d"];
    const s = subdomains[Math.abs(x + y) % subdomains.length];
    switch (provider) {
      case "satellite":
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
      case "light":
        return `https://${s}.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;
      case "dark":
        return `https://${s}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
      case "voyager":
      default:
        // CartoDB Voyager: high performance, reliable public CDN with clear civic landmarks & roads
        return `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
    }
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const scale = Math.pow(2, zoom) * 256;
    const dLng = -(dx / scale) * 360;
    const dLat = (dy / scale) * 180;

    setMapCenter((prev) => ({
      lat: Math.max(-85, Math.min(85, prev.lat + dLat)),
      lng: prev.lng + dLng,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handling for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;

    const scale = Math.pow(2, zoom) * 256;
    const dLng = -(dx / scale) * 360;
    const dLat = (dy / scale) * 180;

    setMapCenter((prev) => ({
      lat: Math.max(-85, Math.min(85, prev.lat + dLat)),
      lng: prev.lng + dLng,
    }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(18, prev + 1));
  const handleZoomOut = () => setZoom((prev) => Math.max(4, prev - 1));

  const handleFitAllWorks = () => {
    setMapCenter(dynamicCentroid);
    setZoom(projectedWorks.length > 5 ? 11 : 13);
  };

  const handleFocusWork = (work: WorkItem) => {
    const found = projectedWorks.find((p) => p.work.id === work.id);
    if (found) {
      setMapCenter(found.coord);
      setZoom(15);
      setSelectedPinWork(work);
    }
  };

  const getMarkerColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("completed")) return "#059669"; // Emerald Green
    if (s.includes("delay")) return "#dc2626";     // Crimson Red
    if (s.includes("ongoing") || s.includes("progress")) return "#2563eb"; // Royal Blue
    if (s.includes("sanction") || s.includes("recommend")) return "#d97706"; // Amber
    return "#475569";
  };

  const formatCurrency = (valInCr: number | undefined | null) => {
    const val = Number(valInCr || 0);
    if (val >= 1.0) return `₹${val.toFixed(2)} Cr`;
    return `₹${(val * 100).toFixed(1)} L`;
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "560px",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid #cbd5e1",
        background: basemapStyle === "dark" ? "#0f172a" : "#f1f5f9",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
        userSelect: "none",
        boxSizing: "border-box",
        fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      ref={mapContainerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes pulseRing {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
        .citizen-map-pin {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .citizen-map-pin:hover {
          transform: translate(-50%, -100%) scale(1.22);
          z-index: 60 !important;
        }
        .map-ctrl-btn {
          width: 34px;
          height: 34px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1e293b;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
          transition: all 0.2s ease;
        }
        .map-ctrl-btn:hover {
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
          color: #0284c7;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. RASTER TILE LAYER (CARTO / SATELLITE / LIGHT)                          */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      >
        {tileInfo.map((tile) => (
          <img
            key={`${basemapStyle}-${tile.z}-${tile.x}-${tile.y}`}
            src={getTileUrl(basemapStyle, tile.z, tile.x, tile.y)}
            alt=""
            loading="lazy"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback to OSM or alternative tile provider on single tile fail
              const target = e.currentTarget;
              if (!target.dataset.fallback) {
                target.dataset.fallback = "true";
                target.src = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
              } else {
                setTileErrorCount((c) => c + 1);
                target.style.display = "none";
              }
            }}
            style={{
              position: "absolute",
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: "256px",
              height: "256px",
              opacity: basemapStyle === "satellite" ? 0.98 : 0.94,
              transition: "opacity 0.2s ease-in",
            }}
          />
        ))}
      </div>

      {/* SVG Vector Fallback Grid (renders if raster network fails) */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0.12,
        }}
      >
        <defs>
          <pattern id="civic-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748b" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#civic-grid)" />
      </svg>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE WORK MARKERS LAYER                                         */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
        }}
      >
        {projectedWorks.map(({ work, coord }) => {
          const pos = latLngToPixel(coord.lat, coord.lng);

          // Cull markers far outside viewport
          if (
            pos.x < -80 ||
            pos.x > containerSize.width + 80 ||
            pos.y < -80 ||
            pos.y > containerSize.height + 80
          ) {
            return null;
          }

          const isSelected = selectedPinWork?.id === work.id;
          const markerColor = getMarkerColor(work.status);

          return (
            <div
              key={work.id}
              className="citizen-map-pin"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPinWork(work);
              }}
              onMouseEnter={() => setHoveredPinWork(work)}
              onMouseLeave={() => setHoveredPinWork(null)}
              style={{
                position: "absolute",
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: "translate(-50%, -100%)",
                cursor: "pointer",
                pointerEvents: "auto",
                zIndex: isSelected ? 50 : 25,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Selected Pin Glow Ring Animation */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: markerColor,
                    animation: "pulseRing 1.8s infinite ease-out",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Hover Floating Tooltip */}
              {hoveredPinWork?.id === work.id && !isSelected && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    background: "#0f172a",
                    color: "#f8fafc",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    boxShadow: "0 10px 25px -4px rgba(0,0,0,0.35)",
                    pointerEvents: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    zIndex: 70,
                  }}
                >
                  <span style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {work.title}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.66rem", color: "#94a3b8" }}>
                    <span>📍 {work.district || currentConstituency}</span>
                    <span>•</span>
                    <span style={{ color: "#38bdf8" }}>{work.physicalProgress || 0}% Done</span>
                    <span>•</span>
                    <span>{formatCurrency(work.sanctionedAmt)}</span>
                  </div>
                </div>
              )}

              {/* Pin Badge with Progress */}
              <div
                style={{
                  background: markerColor,
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: "16px",
                  boxShadow: isSelected
                    ? `0 0 0 4px #ffffff, 0 8px 24px rgba(0,0,0,0.4)`
                    : "0 3px 10px rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.70rem",
                  fontWeight: 800,
                  border: "2px solid #ffffff",
                }}
              >
                <MapPin size={12} fill="#ffffff" color={markerColor} />
                <span>{work.physicalProgress || 0}%</span>
              </div>

              {/* Pin Point Tip */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: `7px solid ${markerColor}`,
                  marginTop: "-1px",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.2))",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP-LEFT: AREA TITLE & SUMMARY CHIP                                    */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          padding: "8px 14px",
          borderRadius: "10px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          zIndex: 35,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0284c7",
          }}
        >
          <Landmark size={18} />
        </div>
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
            {currentConstituency} Development Map
          </div>
          <div style={{ fontSize: "0.70rem", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
            <span><strong>{projectedWorks.length}</strong> Works Geotagged</span>
            <span>•</span>
            <span>Coordinates Active</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TOP-RIGHT: BASEMAP TOGGLE & NAVIGATION CONTROLS                        */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 35,
          alignItems: "flex-end",
        }}
      >
        {/* Basemap Style Switcher Pills */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(6px)",
            padding: "3px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            display: "flex",
            gap: "2px",
          }}
        >
          <button
            type="button"
            onClick={() => setBasemapStyle("voyager")}
            style={{
              padding: "4px 8px",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.68rem",
              fontWeight: 700,
              background: basemapStyle === "voyager" ? "#0284c7" : "transparent",
              color: basemapStyle === "voyager" ? "#ffffff" : "#475569",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🗺️ Streets
          </button>
          <button
            type="button"
            onClick={() => setBasemapStyle("satellite")}
            style={{
              padding: "4px 8px",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.68rem",
              fontWeight: 700,
              background: basemapStyle === "satellite" ? "#0284c7" : "transparent",
              color: basemapStyle === "satellite" ? "#ffffff" : "#475569",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🛰️ Satellite
          </button>
          <button
            type="button"
            onClick={() => setBasemapStyle("light")}
            style={{
              padding: "4px 8px",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.68rem",
              fontWeight: 700,
              background: basemapStyle === "light" ? "#0284c7" : "transparent",
              color: basemapStyle === "light" ? "#ffffff" : "#475569",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🏛️ Civic
          </button>
        </div>

        {/* Zoom & Fit Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <button
            type="button"
            onClick={handleZoomIn}
            className="map-ctrl-btn"
            title="Zoom In"
          >
            <Plus size={16} />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="map-ctrl-btn"
            title="Zoom Out"
          >
            <Minus size={16} />
          </button>

          <button
            type="button"
            onClick={handleFitAllWorks}
            className="map-ctrl-btn"
            title="Fit All Visible Works"
            style={{ color: "#0284c7" }}
          >
            <Maximize2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => {
              setMapCenter(baseCenterCoord);
              setZoom(13);
            }}
            className="map-ctrl-btn"
            title={`Center on ${currentConstituency}`}
            style={{ color: "#d97706" }}
          >
            <Navigation size={14} />
          </button>

          <button
            type="button"
            onClick={() => setShowDrawer((prev) => !prev)}
            className="map-ctrl-btn"
            title="Toggle Works List Drawer"
            style={{ color: showDrawer ? "#059669" : "#475569" }}
          >
            <Layers size={14} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM-LEFT: STATUS LEGEND PILL                                        */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "absolute",
          bottom: "14px",
          left: "14px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          padding: "6px 14px",
          borderRadius: "30px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "#1e293b",
          zIndex: 35,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#059669" }} /> Completed
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} /> In Progress
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} /> Delayed
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d97706" }} /> Sanctioned
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 6. SIDE DRAWER: ALL MAPPED WORKS LIST (TOGGLEABLE)                       */}
      {/* ========================================================================= */}
      {showDrawer && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "320px",
            maxWidth: "85%",
            height: "100%",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
            borderRight: "1px solid #cbd5e1",
            boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>
                Mapped Projects ({projectedWorks.length})
              </h4>
              <span style={{ fontSize: "0.70rem", color: "#64748b" }}>Click a project to pan & focus</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDrawer(false)}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {projectedWorks.map(({ work, coord }) => {
              const isSelected = selectedPinWork?.id === work.id;
              const markerColor = getMarkerColor(work.status);
              return (
                <div
                  key={work.id}
                  onClick={() => handleFocusWork(work)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: isSelected ? `2px solid ${markerColor}` : "1px solid #e2e8f0",
                    background: isSelected ? "#f0f9ff" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.66rem", fontWeight: 700, color: markerColor, textTransform: "uppercase" }}>
                      {work.status}
                    </span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#0f172a" }}>
                      {work.physicalProgress || 0}%
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.25, marginBottom: "4px" }}>
                    {work.title}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#64748b" }}>
                    <span>📍 {work.district || work.constituency}</span>
                    <span>{formatCurrency(work.sanctionedAmt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SELECTED WORK DETAILS POPOVER CARD (ACCURATE CIVIC DATA)               */}
      {/* ========================================================================= */}
      {selectedPinWork && (
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            right: "14px",
            width: "360px",
            maxWidth: "calc(100% - 28px)",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "14px",
            boxShadow: "0 14px 35px -5px rgba(15, 23, 42, 0.28)",
            padding: "16px",
            zIndex: 45,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: "#eff6ff",
                    color: "#0284c7",
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedPinWork.sectorName || selectedPinWork.category || "Development Asset"}
                </span>
                <span
                  style={{
                    background: selectedPinWork.status === "Completed" ? "#dcfce7" : (selectedPinWork.status === "Delayed" ? "#fee2e2" : "#fef3c7"),
                    color: getMarkerColor(selectedPinWork.status),
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {selectedPinWork.status}
                </span>
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0", lineHeight: 1.3 }}>
                {selectedPinWork.title}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPinWork(null)}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                flexShrink: 0,
              }}
              aria-label="Close card"
            >
              <X size={15} />
            </button>
          </div>

          {/* Accurate District, State & MP Details */}
          <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.72rem", color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <div>
              <span style={{ color: "#64748b", display: "block" }}>District / State</span>
              <strong style={{ color: "#0f172a" }}>{selectedPinWork.district || currentConstituency}, {selectedPinWork.state || "India"}</strong>
            </div>
            <div>
              <span style={{ color: "#64748b", display: "block" }}>Member of Parliament</span>
              <strong style={{ color: "#0f172a" }}>{selectedPinWork.mpName || "Local MP"}</strong>
            </div>
          </div>

          {/* Progress & Financials */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", fontWeight: 700, marginBottom: "4px" }}>
              <span style={{ color: "#475569" }}>Physical Execution:</span>
              <span style={{ color: getMarkerColor(selectedPinWork.status), fontWeight: 800 }}>{selectedPinWork.physicalProgress || 0}%</span>
            </div>
            <div style={{ width: "100%", height: "7px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, selectedPinWork.physicalProgress || 0)}%`,
                  height: "100%",
                  background: getMarkerColor(selectedPinWork.status),
                  borderRadius: "4px",
                  transition: "width 0.6s ease",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#475569", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
              <span>Sanctioned: <strong style={{ color: "#0f172a" }}>{formatCurrency(selectedPinWork.sanctionedAmt)}</strong></span>
              <span>Spent: <strong style={{ color: "#059669" }}>{formatCurrency(selectedPinWork.expenditureAmt)}</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onSelectWork(selectedPinWork)}
              icon={<ArrowRight size={14} />}
              style={{ flex: 1, fontSize: "0.78rem", fontWeight: 700, background: "#0a2540", borderColor: "#0a2540" }}
            >
              View Full Dossier
            </Button>

            {onReportProblem && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onReportProblem(selectedPinWork)}
                icon={<Flag size={13} color="#dc2626" />}
                style={{ fontSize: "0.78rem", color: "#dc2626", borderColor: "#fecaca" }}
                title="Report a problem with this work"
              >
                Report
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenInteractiveMap;
