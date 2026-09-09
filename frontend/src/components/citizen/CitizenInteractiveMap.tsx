import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  MapPin, Plus, Minus, Navigation, Layers, CheckCircle2, 
  Clock, AlertTriangle, ArrowRight, X, IndianRupee, Landmark,
  ExternalLink, Flag, Search, Filter, Compass, Maximize2, Minimize2, Eye
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { Button } from "../ui";
import { getCategoryFallbackImage } from "../../utils/imageUploadHelper";

export interface CitizenInteractiveMapProps {
  works: WorkItem[];
  currentConstituency?: string;
  onSelectWork: (work: WorkItem) => void;
  onReportProblem?: (work: WorkItem) => void;
  onOpenReportModal?: (work: WorkItem) => void;
}

interface Coordinate {
  lat: number;
  lng: number;
}

type BasemapStyle = "voyager" | "street" | "satellite" | "light";

// Comprehensive Indian Geographic Coordinates Dictionary for States, Districts, and Constituencies
const INDIA_GEO_COORDINATES: Record<string, Coordinate> = {
  // Maharashtra
  "pune": { lat: 18.5204, lng: 73.8567 },
  "baramati": { lat: 18.1517, lng: 74.5770 },
  "shirur": { lat: 18.8267, lng: 74.3789 },
  "maval": { lat: 18.7537, lng: 73.4842 },
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
  "jind": { lat: 29.3156, lng: 76.3148 },
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

// Deterministic local scatter around a district center (1.5km - 4.5km radius)
const spreadLocally = (center: Coordinate, seedStr: string, index: number, radiusScale: number = 0.02): Coordinate => {
  const hash = (seedStr || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + (index + 1) * 31;
  const angle = ((hash % 360) * Math.PI) / 180;
  const dist = radiusScale + ((hash % 35) / 1000);
  return {
    lat: center.lat + Math.sin(angle) * dist,
    lng: center.lng + Math.cos(angle) * (dist * 1.05),
  };
};

// Accurate geocoding resolver for a work item
const resolveWorkCoordinate = (work: WorkItem, index: number, fallbackCenter: Coordinate): Coordinate => {
  if ((work as any).latitude && (work as any).longitude) {
    const lat = Number((work as any).latitude);
    const lng = Number((work as any).longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
  }

  const normDistrict = (work.district || "").trim().toLowerCase();
  if (normDistrict && INDIA_GEO_COORDINATES[normDistrict]) {
    const center = INDIA_GEO_COORDINATES[normDistrict];
    return spreadLocally(center, work.id, index);
  }

  const normConstituency = (work.constituency || "").trim().toLowerCase();
  if (normConstituency && INDIA_GEO_COORDINATES[normConstituency]) {
    const center = INDIA_GEO_COORDINATES[normConstituency];
    return spreadLocally(center, work.id, index);
  }

  const normState = (work.state || "").trim().toLowerCase();
  if (normState && INDIA_GEO_COORDINATES[normState]) {
    const center = INDIA_GEO_COORDINATES[normState];
    return spreadLocally(center, work.id, index, 0.04);
  }

  return spreadLocally(fallbackCenter, work.id, index);
};

export const CitizenInteractiveMap: React.FC<CitizenInteractiveMapProps> = ({
  works,
  currentConstituency = "Pune",
  onSelectWork,
  onReportProblem,
  onOpenReportModal
}) => {
  // Aliased report problem action
  const reportAction = onReportProblem || onOpenReportModal;

  const normConst = (currentConstituency || "rohtak").trim().toLowerCase();
  const baseCenterCoord = useMemo(() => {
    return INDIA_GEO_COORDINATES[normConst] || 
      Object.entries(INDIA_GEO_COORDINATES).find(([k]) => normConst.includes(k))?.[1] || 
      INDIA_GEO_COORDINATES["rohtak"] ||
      INDIA_GEO_COORDINATES["pune"];
  }, [normConst]);

  const [searchMapQuery, setSearchMapQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedPinWork, setSelectedPinWork] = useState<WorkItem | null>(null);
  const [hoveredPinWork, setHoveredPinWork] = useState<WorkItem | null>(null);
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>("voyager");

  // Filter works by search and category
  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      if (filterCategory !== "all") {
        const cat = (w.category || w.sectorName || "").toLowerCase();
        if (!cat.includes(filterCategory.toLowerCase())) return false;
      }
      if (searchMapQuery.trim()) {
        const q = searchMapQuery.toLowerCase();
        const matchTitle = (w.title || "").toLowerCase().includes(q);
        const matchId = (w.id || "").toLowerCase().includes(q);
        const matchDist = (w.district || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchDist) return false;
      }
      return true;
    });
  }, [works, filterCategory, searchMapQuery]);

  // Projected works with accurate geographic coordinates
  const projectedWorks = useMemo(() => {
    return filteredWorks.map((work, idx) => {
      const coord = resolveWorkCoordinate(work, idx, baseCenterCoord);
      return { work, coord };
    });
  }, [filteredWorks, baseCenterCoord]);

  // Centroid
  const dynamicCentroid = useMemo<Coordinate>(() => {
    if (projectedWorks.length === 0) return baseCenterCoord;
    const totalLat = projectedWorks.reduce((sum, item) => sum + item.coord.lat, 0);
    const totalLng = projectedWorks.reduce((sum, item) => sum + item.coord.lng, 0);
    return {
      lat: totalLat / projectedWorks.length,
      lng: totalLng / projectedWorks.length,
    };
  }, [projectedWorks, baseCenterCoord]);

  const [mapCenter, setMapCenter] = useState<Coordinate>(baseCenterCoord);
  const [zoom, setZoom] = useState<number>(13);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 560 });

  // Update container size on mount and resize with ResizeObserver
  useEffect(() => {
    const updateSize = () => {
      if (mapContainerRef.current) {
        const w = mapContainerRef.current.clientWidth;
        const h = mapContainerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          setContainerSize({ width: w, height: h });
        }
      }
    };
    updateSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      ro = new ResizeObserver(() => updateSize());
      ro.observe(mapContainerRef.current);
    }

    const timer = setTimeout(updateSize, 100);
    window.addEventListener("resize", updateSize);
    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [isFullscreen]);

  // Sync center when constituency changes
  useEffect(() => {
    setMapCenter(baseCenterCoord);
    setSelectedPinWork(null);
    setZoom(13);
  }, [baseCenterCoord]);

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
    switch (provider) {
      case "satellite":
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
      case "street":
      case "light":
      case "voyager":
      default:
        return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".map-ui-control")) return;
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
    if ((e.target as HTMLElement).closest(".map-ui-control")) return;
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

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest(".map-ui-control")) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(18, prev + 1));
    } else {
      setZoom((prev) => Math.max(5, prev - 1));
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(18, prev + 1));
  const handleZoomOut = () => setZoom((prev) => Math.max(5, prev - 1));

  const handleFitAllWorks = () => {
    setMapCenter(dynamicCentroid);
    setZoom(projectedWorks.length > 5 ? 11 : 13);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setZoom(14);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 6000 }
    );
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
    if (s.includes("completed")) return { bg: "#059669", ring: "#10b981", label: "Completed" };
    if (s.includes("delay")) return { bg: "#dc2626", ring: "#ef4444", label: "Delayed" };
    if (s.includes("ongoing") || s.includes("progress")) return { bg: "#2563eb", ring: "#3b82f6", label: "In Progress" };
    if (s.includes("sanction") || s.includes("recommend")) return { bg: "#d97706", ring: "#f59e0b", label: "Sanctioned" };
    return { bg: "#475569", ring: "#64748b", label: status };
  };

  const formatCurrency = (valInCr: number | undefined | null) => {
    const val = Number(valInCr || 0);
    if (val >= 1.0) return `₹${val.toFixed(2)} Cr`;
    return `₹${(val * 100).toFixed(1)} L`;
  };

  return (
    <div
      style={{
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        width: isFullscreen ? "100vw" : "100%",
        height: isFullscreen ? "100vh" : "560px",
        zIndex: isFullscreen ? 9999 : 10,
        borderRadius: isFullscreen ? 0 : "14px",
        overflow: "hidden",
        border: isFullscreen ? "none" : "1px solid #cbd5e1",
        background: basemapStyle === "satellite" ? "#0f172a" : "#f1f5f9",
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
      onWheel={handleWheel}
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
        .map-ui-control {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          backdrop-filter: blur(8px);
        }
      `}</style>

      {/* 1. RASTER TILE LAYER */}
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
              const target = e.currentTarget;
              if (!target.dataset.fallback) {
                target.dataset.fallback = "true";
                target.src = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
              }
            }}
            style={{
              position: "absolute",
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: "256px",
              height: "256px",
              opacity: basemapStyle === "satellite" ? 0.98 : 0.95,
              transition: "opacity 0.2s ease-in",
            }}
          />
        ))}
      </div>

      {/* 2. TOP TOOLBAR: SEARCH & CATEGORY FILTERS */}
      <div
        className="map-ui-control"
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          right: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          zIndex: 35,
          pointerEvents: "auto",
        }}
      >
        {/* Search Input on Map */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.95)", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", width: "260px", maxWidth: "100%" }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="Search mapped works by title/ID..."
            value={searchMapQuery}
            onChange={(e) => setSearchMapQuery(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.78rem", width: "100%", color: "#0f172a" }}
          />
          {searchMapQuery && (
            <button onClick={() => setSearchMapQuery("")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", background: "rgba(255,255,255,0.92)", padding: "4px 8px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)" }}>
          {[
            { id: "all", label: "All Works" },
            { id: "road", label: "Roads" },
            { id: "water", label: "Water" },
            { id: "school", label: "Education" },
            { id: "health", label: "Health" },
            { id: "solar", label: "Solar" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              style={{
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "0.70rem",
                fontWeight: filterCategory === cat.id ? 700 : 500,
                background: filterCategory === cat.id ? "var(--gov-primary, #0a2540)" : "transparent",
                color: filterCategory === cat.id ? "#ffffff" : "#475569",
                cursor: "pointer"
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Mapped Works Count Badge */}
        <div style={{ background: "rgba(10,37,64,0.92)", color: "#ffffff", padding: "6px 12px", borderRadius: "8px", fontSize: "0.74rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={13} color="var(--gov-accent, #ff9933)" />
          <span>{projectedWorks.length} Active Works Pinned in {currentConstituency}</span>
        </div>
      </div>

      {/* 3. INTERACTIVE PROJECT PINS */}
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

          if (
            pos.x < -80 ||
            pos.x > containerSize.width + 80 ||
            pos.y < -80 ||
            pos.y > containerSize.height + 80
          ) {
            return null;
          }

          const isSelected = selectedPinWork?.id === work.id;
          const colorMeta = getMarkerColor(work.status);

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
                    background: colorMeta.bg,
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

              {/* Pin Graphics */}
              <div
                style={{
                  width: isSelected ? "36px" : "28px",
                  height: isSelected ? "36px" : "28px",
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-45deg)",
                  background: colorMeta.bg,
                  border: `2.5px solid #ffffff`,
                  boxShadow: isSelected 
                    ? `0 0 0 4px ${colorMeta.ring}, 0 6px 16px rgba(0,0,0,0.35)` 
                    : "0 3px 8px rgba(0,0,0,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ transform: "rotate(45deg)", color: "#ffffff", fontSize: "0.7rem", fontWeight: 800 }}>
                  {work.status === "Completed" ? <CheckCircle2 size={13} /> : (work.status === "Delayed" ? <AlertTriangle size={13} /> : <Landmark size={12} />)}
                </div>
              </div>

              {/* Pin Base Dot */}
              <div
                style={{
                  width: "8px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.3)",
                  marginTop: "-1px"
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 4. TOP-RIGHT: BASEMAP TOGGLE CONTROLS */}
      <div
        className="map-ui-control"
        style={{
          position: "absolute",
          top: "62px",
          right: "14px",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "3px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          display: "flex",
          gap: "2px",
          zIndex: 35,
          pointerEvents: "auto",
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
          }}
        >
          🗺️ Topo
        </button>
        <button
          type="button"
          onClick={() => setBasemapStyle("street")}
          style={{
            padding: "4px 8px",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.68rem",
            fontWeight: 700,
            background: basemapStyle === "street" ? "#0284c7" : "transparent",
            color: basemapStyle === "street" ? "#ffffff" : "#475569",
            cursor: "pointer",
          }}
        >
          🏛️ Civic
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
          }}
        >
          Clean
        </button>
      </div>

      {/* 5. SIDE DRAWER: ALL MAPPED WORKS LIST */}
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
            {projectedWorks.map(({ work }) => {
              const isSelected = selectedPinWork?.id === work.id;
              const colorMeta = getMarkerColor(work.status);
              return (
                <div
                  key={work.id}
                  onClick={() => handleFocusWork(work)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: isSelected ? `2px solid ${colorMeta.bg}` : "1px solid #e2e8f0",
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
                    <span style={{ fontSize: "0.66rem", fontWeight: 700, color: colorMeta.bg, textTransform: "uppercase" }}>
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

      {/* 6. SELECTED WORK DETAILS CARD */}
      {selectedPinWork && (
        <div
          className="map-ui-control"
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            maxWidth: "380px",
            width: "calc(100% - 32px)",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            padding: "16px",
            zIndex: 45,
            pointerEvents: "auto",
            animation: "fadeIn 0.2s ease"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.74rem", fontWeight: 800, color: "var(--gov-primary)" }}>
                  {selectedPinWork.id}
                </span>
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
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: selectedPinWork.status === "Completed" ? "#dcfce7" : (selectedPinWork.status === "Delayed" ? "#fee2e2" : "#fef3c7"),
                    color: getMarkerColor(selectedPinWork.status).bg,
                  }}
                >
                  {selectedPinWork.status}
                </span>
              </div>
              <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                {selectedPinWork.title}
              </h4>
            </div>

            <button
              onClick={() => setSelectedPinWork(null)}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                flexShrink: 0
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* District & MP info */}
          <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.72rem", color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
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
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", fontWeight: 700, marginBottom: "4px" }}>
              <span style={{ color: "#475569" }}>Physical Execution:</span>
              <span style={{ color: getMarkerColor(selectedPinWork.status).bg, fontWeight: 800 }}>{selectedPinWork.physicalProgress || 0}%</span>
            </div>
            <div style={{ width: "100%", height: "7px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, selectedPinWork.physicalProgress || 0)}%`,
                  height: "100%",
                  background: getMarkerColor(selectedPinWork.status).bg,
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
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              variant="primary"
              size="sm"
              style={{ flex: 1, fontSize: "0.78rem" }}
              onClick={() => onSelectWork(selectedPinWork)}
              icon={<Eye size={13} />}
            >
              View Full Dossier
            </Button>

            {reportAction && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => reportAction(selectedPinWork)}
                icon={<Flag size={13} color="#dc2626" />}
                style={{ color: "#dc2626", borderColor: "#fecaca" }}
                title="Report issue with this work"
              >
                Report Issue
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 7. FLOATING CONTROLS TOOLBAR (RIGHT SIDE) */}
      <div
        className="map-ui-control"
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 35,
          pointerEvents: "auto",
        }}
      >
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
          onClick={handleLocateMe}
          className="map-ctrl-btn"
          title="My Location"
          style={{ color: isLocating ? "#2563eb" : "#0f172a" }}
        >
          <Compass size={14} className={isLocating ? "spin" : ""} />
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

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="map-ctrl-btn"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* 8. STATUS LEGEND */}
      <div
        className="map-ui-control"
        style={{
          position: "absolute",
          bottom: "14px",
          left: "14px",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "6px 14px",
          borderRadius: "30px",
          border: "1px solid #cbd5e1",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "#1e293b",
          zIndex: 30,
          flexWrap: "wrap",
          pointerEvents: "none",
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
    </div>
  );
};

export default CitizenInteractiveMap;
