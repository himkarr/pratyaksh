import React from "react";
import { Camera, FileText, Image as ImageIcon, CheckCircle, Upload, MapPin } from "lucide-react";
import { WorkAttachment } from "../../data/mpladsData";
import { Card, CardHeader, CardBody, Button, Badge } from "../ui";

export interface EvidenceSectionProps {
  attachments: WorkAttachment[];
  onUploadClick?: () => void;
  canUpload?: boolean;
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  attachments,
  onUploadClick,
  canUpload = false
}) => {
  return (
    <Card>
      <CardHeader
        title="Geotagged Evidence & Site Attachments"
        icon={<Camera size={16} />}
        actions={
          canUpload && (
            <Button variant="primary" size="sm" onClick={onUploadClick} icon={<Upload size={13} />}>
              Upload Photo/Doc
            </Button>
          )
        }
      />

      <CardBody>
        {attachments.length === 0 ? (
          <div style={{ textTransform: "none", textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            No photographic or document evidence uploaded for this project yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
            {attachments.map((att) => (
              <div
                key={att.id}
                style={{
                  border: "1px solid var(--border-main)",
                  borderRadius: "var(--radius-xs)",
                  overflow: "hidden",
                  background: "var(--bg-surface)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {att.type === "image" ? (
                  <div style={{ position: "relative", height: "130px", background: "#f1f5f9", overflow: "hidden" }}>
                    <img
                      src={att.url}
                      alt={att.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{ position: "absolute", top: "6px", right: "6px" }}>
                      <Badge variant="success" icon={<CheckCircle size={10} />}>
                        GEOTAGGED
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: "100px", background: "var(--bg-surface-subtle)", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--border-light)" }}>
                    <FileText size={36} color="var(--gov-primary)" />
                  </div>
                )}

                <div style={{ padding: "10px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Stage: {att.stage}
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px", lineHeight: "1.25" }}>
                      {att.title}
                    </div>
                  </div>

                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <MapPin size={12} /> Verified Location
                    </span>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--gov-accent)", fontWeight: 600 }}
                    >
                      View Full
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default EvidenceSection;
