import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  MapPin, Plus, Minus, Navigation, Layers, CheckCircle2, 
  Clock, AlertTriangle, ArrowRight, X, IndianRupee, Landmark
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { Button } from "../ui";

export interface CitizenInteractiveMapProps {
  works: WorkItem[];
  currentConstituency?: string;
  onSelectWork: (work: WorkItem) => void;
}

interface Coordinate {
  lat: number;
  lng: number;
}

// Center coordinates for constituencies
const CONSTITUENCY_CENTERS: Record<string, Coordinate> = {
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Varanasi": { lat: 25.3176, lng: 82.9739 },
  "New Delhi": { lat: 28.6139, lng: 77.2090 },
  "Bangalore South": { lat: 12.9250, lng: 77.5838 },
  "Chennai South": { lat: 12.9863, lng: 80.2184 }
};

// Deterministic coordinate generator for works in a constituency
const getWorkCoordinates = (work: WorkItem, baseCenter: Coordinate, index: number): Coordinate => {
  if ((work as any).latitude && (work as any).longitude) {
    return { lat: (work as any).latitude, lng: (work as any).longitude };
  }

  // Pre-configured landmark points for Pune demo works
  const puneLandmarks: Record<string, Coordinate> = {
    "CUST-003": { lat: 18.5314, lng: 73.8446 }, // Shivajinagar
    "CUST-004": { lat: 18.5196, lng: 73.8553 }, // Deccan / Camp
    "CUST-009": { lat: 18.5074, lng: 73.8077 }, // Kothrud
    "CUST-010": { lat: 18.5626, lng: 73.8087 }, // Aundh
    "CUST-015": { lat: 18.4795, lng: 73.8012 }, // Warje
    "CUST-016": { lat: 18.5529, lng: 73.9167 }, // Wadgaon Sheri
    "MPLAD-MH-001": { lat: 18.5290, lng: 73.8400 },
    "MPLAD-MH-002": { lat: 18.5100, lng: 73.8250 },
    "MPLAD-MH-003": { lat: 18.5450, lng: 73.8800 },
    "MPLAD-MH-004": { lat: 18.4950, lng: 73.8500 },
    "MPLAD-MH-005": { lat: 18.5600, lng: 73.8300 }
  };

  if (puneLandmarks[work.id]) {
    return puneLandmarks[work.id];
  }

  // Generate deterministic spread around city center using simple hash
  const hash = work.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 17;
  const angle = ((hash % 360) * Math.PI) / 180;
  const distance = 0.02 + ((hash % 45) / 1000); // approx 2km to 6km radius
  
  return {
    lat: baseCenter.lat + Math.sin(angle) * distance,
    lng: baseCenter.lng + Math.cos(angle) * (distance * 1.08)
  };
};

export const CitizenInteractiveMap: React.FC<CitizenInteractiveMapProps> = ({
  works,
  currentConstituency = "Pune",
  onSelectWork
}) => {
  const centerCoord = CONSTITUENCY_CENTERS[currentConstituency] || CONSTITUENCY_CENTERS["Pune"];
  
  const [mapCenter, setMapCenter] = useState<Coordinate>(centerCoord);
  const [zoom, setZoom] = useState<number>(13);
  const [selectedPinWork, setSelectedPinWork] = useState<WorkItem | null>(null);
  const [hoveredPinWork, setHoveredPinWork] = useState<WorkItem | null>(null);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Update center when constituency changes
  useEffect(() => {
    const newCenter = CONSTITUENCY_CENTERS[currentConstituency] || CONSTITUENCY_CENTERS["Pune"];
    setMapCenter(newCenter);
    setSelectedPinWork(null);
  }, [currentConstituency]);

  // Map projection helpers (Web Mercator)
  const latLngToPixel = (lat: number, lng: number, containerWidth: number, containerHeight: number) => {
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
  };

  // Generate tiles for current viewport
  const tileInfo = useMemo(() => {
    const scale = Math.pow(2, zoom);
    const centerTileX = ((mapCenter.lng + 180) / 360) * scale;
    const latRad = (mapCenter.lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const centerTileY = (1 - mercN / Math.PI) * 0.5 * scale;

    const startTileX = Math.floor(centerTileX) - 2;
    const endTileX = Math.floor(centerTileX) + 2;
    const startTileY = Math.floor(centerTileY) - 2;
    const endTileY = Math.floor(centerTileY) + 2;

    const tiles: { x: number; y: number; z: number; left: number; top: number }[] = [];
    const tileSize = 256;

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

  // Project points
  const projectedWorks = useMemo(() => {
    return works.map((work, idx) => {
      const coord = getWorkCoordinates(work, centerCoord, idx);
      return { work, coord };
    });
  }, [works, centerCoord]);

  // Mouse drag handling
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
      lng: prev.lng + dLng
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handling for mobile
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
      lng: prev.lng + dLng
    }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(17, prev + 1));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(10, prev - 1));
  };

  const handleResetCenter = () => {
    setMapCenter(centerCoord);
    setZoom(13);
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "#059669"; // Green
      case "Delayed":
        return "#dc2626"; // Red
      case "Ongoing":
        return "#2563eb"; // Blue
      case "Sanctioned":
      case "Recommended":
        return "#d97706"; // Amber
      default:
        return "#4b5563";
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "520px",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
        border: "1px solid var(--border-main)",
        background: "#e5e7eb",
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
    >
      <style>{`
        .citizen-map-marker-pin {
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .citizen-map-marker-pin:hover {
          transform: translate(-50%, -100%) scale(1.18);
          z-index: 50 !important;
        }
      `}</style>

      {/* 1. OpenStreetMap Raster Tiles Layer */}
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
            key={`${tile.z}-${tile.x}-${tile.y}`}
            src={`https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`}
            alt=""
            loading="lazy"
            style={{
              position: "absolute",
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: "256px",
              height: "256px",
              opacity: 0.95
            }}
          />
        ))}
      </div>

      {/* 2. Interactive Project Markers Overlay */}
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
          const containerWidth = mapContainerRef.current?.clientWidth || 800;
          const containerHeight = mapContainerRef.current?.clientHeight || 520;
          const pos = latLngToPixel(coord.lat, coord.lng, containerWidth, containerHeight);

          // Hide markers far outside screen
          if (pos.x < -60 || pos.x > containerWidth + 60 || pos.y < -60 || pos.y > containerHeight + 60) {
            return null;
          }

          const isSelected = selectedPinWork?.id === work.id;
          const markerColor = getMarkerColor(work.status);

          return (
            <div
              key={work.id}
              className="citizen-map-marker-pin"
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
                zIndex: isSelected ? 40 : 20,
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
                    bottom: "calc(100% + 4px)",
                    background: "rgba(15, 23, 42, 0.92)",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                    pointerEvents: "none"
                  }}
                >
                  {work.title.slice(0, 36)}... &bull; {work.physicalProgress || 0}%
                </div>
              )}

              {/* Pin SVG Graphic */}
              <div
                style={{
                  background: markerColor,
                  color: "#ffffff",
                  padding: "4px 7px",
                  borderRadius: "14px",
                  boxShadow: isSelected ? `0 0 0 4px rgba(255, 255, 255, 0.9), 0 6px 16px rgba(0,0,0,0.4)` : "0 3px 8px rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  border: "1.5px solid #ffffff"
                }}
              >
                <MapPin size={12} fill="#ffffff" color={markerColor} />
                <span>{work.physicalProgress || 0}%</span>
              </div>

              {/* Pin Needle Tail */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: `6px solid ${markerColor}`,
                  marginTop: "-1px"
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 3. Top-Left Map Controls: Area Info & Re-center */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(6px)",
          padding: "8px 12px",
          borderRadius: "var(--radius-xs)",
          border: "1px solid var(--border-main)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 30
        }}
      >
        <Landmark size={15} color="var(--gov-accent)" />
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--gov-primary)", lineHeight: 1.1 }}>
            {currentConstituency} Development Map
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            {works.length} Public Projects Mapped
          </div>
        </div>
      </div>

      {/* 4. Top-Right Map Controls: Zoom (+ / -) & Center Button */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 30
        }}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          style={{
            width: "32px",
            height: "32px",
            background: "#ffffff",
            border: "1px solid var(--border-main)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            color: "var(--text-main)"
          }}
          title="Zoom In"
        >
          <Plus size={16} />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          style={{
            width: "32px",
            height: "32px",
            background: "#ffffff",
            border: "1px solid var(--border-main)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            color: "var(--text-main)"
          }}
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>

        <button
          type="button"
          onClick={handleResetCenter}
          style={{
            width: "32px",
            height: "32px",
            background: "#ffffff",
            border: "1px solid var(--border-main)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            color: "var(--gov-accent)"
          }}
          title="Reset to Constituency Center"
        >
          <Navigation size={14} />
        </button>
      </div>

      {/* 5. Bottom-Left Map Status Legend */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(6px)",
          padding: "6px 12px",
          borderRadius: "var(--radius-xs)",
          border: "1px solid var(--border-main)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "0.70rem",
          fontWeight: 600,
          color: "var(--text-main)",
          zIndex: 30,
          flexWrap: "wrap"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#059669" }} /> Completed
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} /> In Progress
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} /> Delayed
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d97706" }} /> Sanctioned
        </span>
      </div>

      {/* 6. Selected Work Details Popover Card */}
      {selectedPinWork && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            width: "320px",
            maxWidth: "calc(100% - 24px)",
            background: "var(--bg-surface, #ffffff)",
            border: "1px solid var(--border-main)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25)",
            padding: "14px",
            zIndex: 45,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            animation: "fadeIn 0.15s ease-out"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
            <div>
              <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.65rem", marginBottom: "4px" }}>
                {selectedPinWork.sectorName || selectedPinWork.category || "Project"}
              </span>
              <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--gov-primary)", margin: "2px 0 0 0", lineHeight: 1.3 }}>
                {selectedPinWork.title}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPinWork(null)}
              style={{
                background: "var(--bg-surface-subtle)",
                border: "none",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-muted)",
                flexShrink: 0
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Progress & Financials */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, marginBottom: "3px" }}>
              <span>Progress</span>
              <span style={{ color: "var(--gov-accent)" }}>{selectedPinWork.physicalProgress || 0}%</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "var(--border-light)", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, selectedPinWork.physicalProgress || 0)}%`,
                  height: "100%",
                  background: selectedPinWork.status === "Completed" ? "#059669" : (selectedPinWork.status === "Delayed" ? "#dc2626" : "var(--gov-accent)"),
                  borderRadius: "3px"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "8px" }}>
              <span>Sanctioned: <strong>₹{(selectedPinWork.sanctionedAmt || 0).toFixed(2)} Cr</strong></span>
              <span>Spent: <strong>₹{(selectedPinWork.expenditureAmt || 0).toFixed(2)} Cr</strong></span>
            </div>
          </div>

          {/* View Details Action Button */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onSelectWork(selectedPinWork)}
            icon={<ArrowRight size={13} />}
            style={{ width: "100%", fontSize: "0.78rem" }}
          >
            View Project Details
          </Button>
        </div>
      )}
    </div>
  );
};

export default CitizenInteractiveMap;
