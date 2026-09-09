import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  MapPin, Plus, Minus, Navigation, Layers, CheckCircle2, 
  Clock, AlertTriangle, ArrowRight, X, IndianRupee, Landmark,
  Search, Maximize2, Minimize2, Compass, Filter, ExternalLink,
  ShieldCheck, Eye, Sparkles
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { Button } from "../ui";
import { getCategoryFallbackImage } from "../../utils/imageUploadHelper";

export interface CitizenInteractiveMapProps {
  works: WorkItem[];
  currentConstituency?: string;
  onSelectWork: (work: WorkItem) => void;
  onOpenReportModal?: (work: WorkItem) => void;
}

interface Coordinate {
  lat: number;
  lng: number;
}

// Broad geographic database of Indian Parliament Constituencies & Districts
const CONSTITUENCY_CENTERS: Record<string, Coordinate> = {
  "pune": { lat: 18.5204, lng: 73.8567 },
  "jabalpur": { lat: 23.1815, lng: 79.9864 },
  "rohtak": { lat: 28.8955, lng: 76.6066 },
  "gurugram": { lat: 28.4595, lng: 77.0266 },
  "kurukshetra": { lat: 29.9695, lng: 76.8783 },
  "varanasi": { lat: 25.3176, lng: 82.9739 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  "bangalore south": { lat: 12.9250, lng: 77.5838 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "chennai south": { lat: 12.9863, lng: 80.2184 },
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "mumbai south": { lat: 18.9388, lng: 72.8354 },
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "lucknow": { lat: 26.8467, lng: 80.9462 },
  "bhopal": { lat: 23.2599, lng: 77.4126 },
  "indore": { lat: 22.7196, lng: 75.8577 },
  "patna": { lat: 25.5941, lng: 85.1376 },
  "nagpur": { lat: 21.1458, lng: 79.0882 },
  "chandigarh": { lat: 30.7333, lng: 76.7794 },
  "surat": { lat: 21.1702, lng: 72.8311 },
  "kochi": { lat: 9.9312, lng: 76.2673 },
  "thiruvananthapuram": { lat: 8.5241, lng: 76.9366 }
};

type MapLayerType = "street" | "voyager" | "satellite" | "clean";

const MAP_LAYERS: Record<MapLayerType, { name: string; url: string; subdomains?: string[] }> = {
  street: {
    name: "Standard Civic",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  },
  voyager: {
    name: "Detailed Topo",
    url: "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
  },
  satellite: {
    name: "Satellite Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  },
  clean: {
    name: "High-Contrast Clean",
    url: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
  }
};

// Deterministic coordinate generator for works in a constituency
const getWorkCoordinates = (work: WorkItem, baseCenter: Coordinate, index: number): Coordinate => {
  if ((work as any).latitude && (work as any).longitude && !isNaN((work as any).latitude) && !isNaN((work as any).longitude)) {
    return { lat: Number((work as any).latitude), lng: Number((work as any).longitude) };
  }

  // Pre-configured landmark points for high-density demonstration areas
  const specificLandmarks: Record<string, Coordinate> = {
    "CUST-003": { lat: 18.5314, lng: 73.8446 },
    "CUST-004": { lat: 18.5196, lng: 73.8553 },
    "CUST-009": { lat: 18.5074, lng: 73.8077 },
    "CUST-010": { lat: 18.5626, lng: 73.8087 },
    "CUST-015": { lat: 18.4795, lng: 73.8012 },
    "CUST-016": { lat: 18.5529, lng: 73.9167 },
    "JBL-2024-001": { lat: 23.1815, lng: 79.9864 },
    "JBL-2024-002": { lat: 23.1650, lng: 79.9500 },
    "JBL-2024-003": { lat: 23.1950, lng: 80.0100 },
    "ROH-2024-001": { lat: 28.8955, lng: 76.6066 },
    "GUR-2024-001": { lat: 28.4595, lng: 77.0266 }
  };

  if (specificLandmarks[work.id]) {
    return specificLandmarks[work.id];
  }

  // Deterministic radial scatter around base center
  const idStr = String(work.id || index);
  const hash = idStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 23;
  const angle = ((hash % 360) * Math.PI) / 180;
  const distance = 0.012 + ((hash % 50) / 1400); // ~1.5km to 4.5km spread

  return {
    lat: baseCenter.lat + Math.sin(angle) * distance,
    lng: baseCenter.lng + Math.cos(angle) * (distance * 1.12)
  };
};

export const CitizenInteractiveMap: React.FC<CitizenInteractiveMapProps> = ({
  works,
  currentConstituency = "Pune",
  onSelectWork,
  onOpenReportModal
}) => {
  const normConstituency = currentConstituency.toLowerCase().trim();
  const defaultCenter = CONSTITUENCY_CENTERS[normConstituency] || 
    Object.entries(CONSTITUENCY_CENTERS).find(([k]) => normConstituency.includes(k))?.[1] || 
    CONSTITUENCY_CENTERS["pune"];
  
  const [mapCenter, setMapCenter] = useState<Coordinate>(defaultCenter);
  const [zoom, setZoom] = useState<number>(13);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>("voyager");
  const [selectedPinWork, setSelectedPinWork] = useState<WorkItem | null>(null);
  const [hoveredPinWork, setHoveredPinWork] = useState<WorkItem | null>(null);
  const [searchMapQuery, setSearchMapQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Update center when constituency prop changes
  useEffect(() => {
    const matched = CONSTITUENCY_CENTERS[normConstituency] || 
      Object.entries(CONSTITUENCY_CENTERS).find(([k]) => normConstituency.includes(k))?.[1] || 
      defaultCenter;
    setMapCenter(matched);
    setSelectedPinWork(null);
  }, [currentConstituency, normConstituency]);

  // Projected works with filter
  const displayedWorks = useMemo(() => {
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

  // Project points
  const projectedWorks = useMemo(() => {
    return displayedWorks.map((work, idx) => {
      const coord = getWorkCoordinates(work, defaultCenter, idx);
      return { work, coord };
    });
  }, [displayedWorks, defaultCenter]);

  // Map projection helpers (Web Mercator)
  const latLngToPixel = useCallback((lat: number, lng: number, containerWidth: number, containerHeight: number) => {
    const scale = Math.pow(2, zoom) * 256;
    
    // World coordinates
    const worldX = ((lng + 180) / 360) * scale;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const worldY = (1 - mercN / Math.PI) * 0.5 * scale;

    // Center world coordinates
    const centerWorldX = ((mapCenter.lng + 180) / 360) * scale;
    const centerLatRad = (mapCenter.lat * Math.PI) / 180;
    const centerMercN = Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2));
    const centerWorldY = (1 - centerMercN / Math.PI) * 0.5 * scale;

    const screenX = containerWidth / 2 + (worldX - centerWorldX);
    const screenY = containerHeight / 2 + (worldY - centerWorldY);

    return { x: screenX, y: screenY };
  }, [mapCenter, zoom]);

  // Generate tiles for current viewport covering full screen without gaps
  const tileInfo = useMemo(() => {
    const scale = Math.pow(2, zoom);
    const centerTileX = ((mapCenter.lng + 180) / 360) * scale;
    const latRad = (mapCenter.lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const centerTileY = (1 - mercN / Math.PI) * 0.5 * scale;

    const containerWidth = mapContainerRef.current?.clientWidth || 1000;
    const containerHeight = mapContainerRef.current?.clientHeight || 600;
    const tileSize = 256;

    const halfTilesX = Math.ceil(containerWidth / (2 * tileSize)) + 1;
    const halfTilesY = Math.ceil(containerHeight / (2 * tileSize)) + 1;

    const startTileX = Math.floor(centerTileX) - halfTilesX;
    const endTileX = Math.floor(centerTileX) + halfTilesX;
    const startTileY = Math.floor(centerTileY) - halfTilesY;
    const endTileY = Math.floor(centerTileY) + halfTilesY;

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
  }, [mapCenter, zoom]);

  // Mouse drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore if clicking on buttons or controls
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
      lng: prev.lng + dLng
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handling for mobile
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
      lng: prev.lng + dLng
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
      setZoom((prev) => Math.min(17, prev + 1));
    } else {
      setZoom((prev) => Math.max(10, prev - 1));
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(17, prev + 1));
  const handleZoomOut = () => setZoom((prev) => Math.max(10, prev - 1));

  const handleResetCenter = () => {
    setMapCenter(defaultCenter);
    setZoom(13);
    setSelectedPinWork(null);
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "Completed":
        return { bg: "#059669", ring: "#10b981", text: "#ffffff", label: "Completed" };
      case "Delayed":
        return { bg: "#dc2626", ring: "#ef4444", text: "#ffffff", label: "Delayed" };
      case "Ongoing":
        return { bg: "#2563eb", ring: "#3b82f6", text: "#ffffff", label: "In Progress" };
      case "Sanctioned":
      case "Recommended":
        return { bg: "#d97706", ring: "#f59e0b", text: "#ffffff", label: "Sanctioned" };
      default:
        return { bg: "#475569", ring: "#64748b", text: "#ffffff", label: status };
    }
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
        borderRadius: isFullscreen ? 0 : "var(--radius-sm)",
        overflow: "hidden",
        border: isFullscreen ? "none" : "1px solid var(--border-main)",
        background: activeLayer === "satellite" ? "#0f172a" : "#f1f5f9",
        boxShadow: "var(--shadow-card)",
        userSelect: "none",
        boxSizing: "border-box"
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
        .citizen-map-pin {
          transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
          will-change: transform;
        }
        .citizen-map-pin:hover {
          transform: translate(-50%, -100%) scale(1.22);
          z-index: 60 !important;
        }
        .map-ui-control {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          backdrop-filter: blur(8px);
        }
      `}</style>

      {/* 1. Map Tiles Layer */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 0,
          height: 0,
          pointerEvents: "none"
        }}
      >
        {tileInfo.map((tile) => (
          <img
            key={`${tile.z}-${tile.x}-${tile.y}-${activeLayer}`}
            src={MAP_LAYERS[activeLayer].url
              .replace("{z}", String(tile.z))
              .replace("{x}", String(tile.x))
              .replace("{y}", String(tile.y))}
            alt=""
            loading="lazy"
            style={{
              position: "absolute",
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: "256px",
              height: "256px",
              opacity: activeLayer === "satellite" ? 0.98 : 0.95
            }}
          />
        ))}
      </div>

      {/* 2. Top Navigation & Category Filter Toolbar */}
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
          zIndex: 70,
          pointerEvents: "auto"
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

      {/* 3. Interactive Project Pins */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none"
        }}
      >
        {projectedWorks.map(({ work, coord }) => {
          const containerWidth = mapContainerRef.current?.clientWidth || 1000;
          const containerHeight = mapContainerRef.current?.clientHeight || 560;
          const pos = latLngToPixel(coord.lat, coord.lng, containerWidth, containerHeight);

          if (pos.x < -80 || pos.x > containerWidth + 80 || pos.y < -80 || pos.y > containerHeight + 80) {
            return null;
          }

          const isSelected = selectedPinWork?.id === work.id;
          const styleInfo = getMarkerColor(work.status);

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
                alignItems: "center"
              }}
            >
              {/* Tooltip on Hover */}
              {hoveredPinWork?.id === work.id && !isSelected && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 6px)",
                    background: "rgba(15, 23, 42, 0.95)",
                    color: "#ffffff",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                    pointerEvents: "none",
                    zIndex: 60,
                    maxWidth: "240px",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  <div style={{ fontWeight: 800, color: styleInfo.ring, fontSize: "0.68rem" }}>{work.id} • {styleInfo.label}</div>
                  <div>{work.title}</div>
                </div>
              )}

              {/* Pin Graphics */}
              <div
                style={{
                  width: isSelected ? "36px" : "28px",
                  height: isSelected ? "36px" : "28px",
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-45deg)",
                  background: styleInfo.bg,
                  border: `2.5px solid #ffffff`,
                  boxShadow: isSelected 
                    ? `0 0 0 4px ${styleInfo.ring}, 0 6px 16px rgba(0,0,0,0.35)` 
                    : "0 3px 8px rgba(0,0,0,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease"
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

      {/* 4. Selected Work Detail Card Overlay */}
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
            borderRadius: "10px",
            border: "1px solid var(--border-main)",
            padding: "16px",
            zIndex: 80,
            pointerEvents: "auto",
            animation: "fadeIn 0.2s ease"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.74rem", fontWeight: 800, color: "var(--gov-primary)" }}>
                  {selectedPinWork.id}
                </span>
                <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.68rem" }}>
                  {selectedPinWork.sectorName || selectedPinWork.category}
                </span>
                <span 
                  className="gov-badge"
                  style={{
                    fontSize: "0.68rem",
                    background: selectedPinWork.status === "Completed" ? "rgba(5,150,105,0.15)" : selectedPinWork.status === "Delayed" ? "rgba(220,38,38,0.15)" : "rgba(37,99,235,0.15)",
                    color: selectedPinWork.status === "Completed" ? "#059669" : selectedPinWork.status === "Delayed" ? "#dc2626" : "#2563eb",
                    border: `1px solid ${selectedPinWork.status === "Completed" ? "#059669" : selectedPinWork.status === "Delayed" ? "#dc2626" : "#2563eb"}`
                  }}
                >
                  {selectedPinWork.status}
                </span>
              </div>
              <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-main)", margin: 0, lineHeight: 1.3 }}>
                {selectedPinWork.title}
              </h4>
            </div>

            <button
              onClick={() => setSelectedPinWork(null)}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: "2px", color: "#64748b" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Key Outlay & Progress */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "10px 0", background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div>
              <div style={{ fontSize: "0.66rem", color: "#64748b" }}>Sanctioned Outlay</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--gov-primary)" }}>
                ₹{((selectedPinWork.sanctionedAmt || 0.10) * 100).toFixed(2)} Lakhs
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.66rem", color: "#64748b" }}>Physical Progress</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: selectedPinWork.status === "Completed" ? "#059669" : "#2563eb" }}>
                {selectedPinWork.physicalProgress || (selectedPinWork.status === "Completed" ? 100 : 45)}%
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "12px" }}>
            District: <strong>{selectedPinWork.district}</strong> | MP: <strong>{selectedPinWork.mpName}</strong>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              variant="primary"
              size="sm"
              style={{ flex: 1 }}
              onClick={() => onSelectWork(selectedPinWork)}
              icon={<Eye size={13} />}
            >
              View Full Work Dossier
            </Button>

            {onOpenReportModal && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenReportModal(selectedPinWork)}
                icon={<AlertTriangle size={13} color="#d97706" />}
              >
                Report Issue
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 5. Map Floating Control Toolbar (Right Side) */}
      <div
        className="map-ui-control"
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 70,
          pointerEvents: "auto",
          background: "rgba(255,255,255,0.95)",
          padding: "6px",
          borderRadius: "8px",
          border: "1px solid rgba(0,0,0,0.12)"
        }}
      >
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{ width: "32px", height: "32px", border: "none", background: "#f8fafc", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a" }}
        >
          <Plus size={16} />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{ width: "32px", height: "32px", border: "none", background: "#f8fafc", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a" }}
        >
          <Minus size={16} />
        </button>

        <button
          onClick={handleResetCenter}
          title="Reset to Center"
          style={{ width: "32px", height: "32px", border: "none", background: "#f8fafc", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a" }}
        >
          <Navigation size={15} />
        </button>

        <button
          onClick={handleLocateMe}
          title="My Location"
          style={{ width: "32px", height: "32px", border: "none", background: "#f8fafc", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isLocating ? "#2563eb" : "#0f172a" }}
        >
          <Compass size={15} className={isLocating ? "spin" : ""} />
        </button>

        {/* Layer Toggle Button */}
        <button
          onClick={() => {
            const layers: MapLayerType[] = ["voyager", "street", "satellite", "clean"];
            const nextIdx = (layers.indexOf(activeLayer) + 1) % layers.length;
            setActiveLayer(layers[nextIdx]);
          }}
          title={`Switch Map Layer (Current: ${MAP_LAYERS[activeLayer].name})`}
          style={{ width: "32px", height: "32px", border: "none", background: "#f8fafc", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a" }}
        >
          <Layers size={15} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          style={{ width: "32px", height: "32px", border: "none", background: "#f8fafc", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a" }}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* Map Legend */}
      <div
        className="map-ui-control"
        style={{
          position: "absolute",
          top: "66px",
          left: "14px",
          background: "rgba(255,255,255,0.92)",
          padding: "6px 10px",
          borderRadius: "6px",
          border: "1px solid rgba(0,0,0,0.1)",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          fontSize: "0.68rem",
          fontWeight: 600,
          color: "#475569",
          pointerEvents: "none",
          zIndex: 65
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#059669" }} />
          <span>Completed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
          <span>In Progress</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d97706" }} />
          <span>Sanctioned</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
          <span>Delayed</span>
        </div>
      </div>
    </div>
  );
};

export default CitizenInteractiveMap;
