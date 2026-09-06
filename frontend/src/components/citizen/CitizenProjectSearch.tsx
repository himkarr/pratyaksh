import React, { useState } from "react";
import { Search, Filter, Landmark, MapPin } from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { ProjectCard } from "../project";
import { Input, Select } from "../ui";

export interface CitizenProjectSearchProps {
  works: WorkItem[];
  onSelectWork: (work: WorkItem) => void;
}

export const CitizenProjectSearch: React.FC<CitizenProjectSearchProps> = ({ works, onSelectWork }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredWorks = works.filter((w) => {
    const matchesSearch =
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.constituency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.mpName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.district.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = selectedSector === "all" || w.category === selectedSector;
    const matchesStatus = selectedStatus === "all" || w.status === selectedStatus;

    return matchesSearch && matchesSector && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Search & Filter Bar */}
      <div style={{ background: "var(--bg-surface)", padding: "14px", border: "1px solid var(--border-main)", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--gov-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Landmark size={16} /> Search Constituency MPLADS Sanctioned Works
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
          <Input
            placeholder="Search by project name, MP, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={16} />}
          />

          <Select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            options={[
              { value: "all", label: "All Sectors" },
              { value: "water", label: "Drinking Water" },
              { value: "education", label: "Education" },
              { value: "roads", label: "Roads & Bridges" },
              { value: "healthcare", label: "Healthcare" }
            ]}
          />

          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "Sanctioned", label: "Sanctioned" },
              { value: "Ongoing", label: "Ongoing" },
              { value: "Completed", label: "Completed" },
              { value: "Delayed", label: "Delayed" }
            ]}
          />
        </div>
      </div>

      {/* Results Count Bar */}
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
        Showing {filteredWorks.length} constituency works
      </div>

      {/* Project Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
        {filteredWorks.map((work) => (
          <ProjectCard key={work.id} project={work} onSelect={onSelectWork} showRisk={false} />
        ))}
      </div>
    </div>
  );
};

export default CitizenProjectSearch;
