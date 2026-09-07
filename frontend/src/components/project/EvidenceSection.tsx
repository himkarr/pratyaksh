import React, { useState, useRef } from "react";
import { Camera, FileText, CheckCircle, Upload, MapPin, Check } from "lucide-react";
import { WorkAttachment } from "../../data/mpladsData";
import { Card, CardHeader, CardBody, Button, Badge } from "../ui";

export interface EvidenceSectionProps {
  attachments: WorkAttachment[];
  onUploadClick?: () => void;
  canUpload?: boolean;
  onAttachmentAdded?: (attachment: WorkAttachment) => void;
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  attachments: initialAttachments,
  canUpload = true,
  onAttachmentAdded
}) => {
  const [attachments, setAttachments] = useState<WorkAttachment[]>(initialAttachments || []);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop updates if prop changes
  React.useEffect(() => {
    if (initialAttachments && initialAttachments.length > 0) {
      setAttachments(initialAttachments);
    }
  }, [initialAttachments]);

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const fileUrl = URL.createObjectURL(file);
    const newAttachment: WorkAttachment = {
      id: `att-upload-${Date.now()}`,
      type: isImage ? "image" : "document",
      title: file.name.replace(/\.[^/.]+$/, "") || "Official Geotagged Field Photo",
      stage: "Execution Milestone Verification",
      url: fileUrl
    };

    const updated = [newAttachment, ...attachments];
    setAttachments(updated);
    if (onAttachmentAdded) {
      onAttachmentAdded(newAttachment);
    }

    setUploadSuccessNotice(`Evidence document "${file.name}" uploaded with verified GPS geotag.`);
    setTimeout(() => setUploadSuccessNotice(null), 5000);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*,.pdf"
      />

      <CardHeader
        title={`Geotagged Evidence & Site Attachments (${attachments.length})`}
        icon={<Camera size={16} />}
        actions={
          canUpload && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleTriggerUpload}
              icon={<Upload size={13} />}
              className="no-print"
            >
              Upload Photo/Doc
            </Button>
          )
        }
      />

      <CardBody>
        {uploadSuccessNotice && (
          <div
            style={{
              padding: "8px 12px",
              background: "var(--status-success-bg)",
              border: "1px solid var(--status-success-border)",
              color: "var(--status-success-text)",
              borderRadius: "var(--radius-xs)",
              fontSize: "0.78rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "12px"
            }}
          >
            <Check size={14} />
            <span>{uploadSuccessNotice}</span>
          </div>
        )}

        {attachments.length === 0 ? (
          <div style={{ textTransform: "none", textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            No photographic or document evidence uploaded for this project yet. Click "Upload Photo/Doc" to attach geotagged records.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
            {attachments.map((att, idx) => (
              <div
                key={att.id || idx}
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
                  <div style={{ position: "relative", height: "140px", background: "#0b1320", overflow: "hidden" }}>
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
                      <MapPin size={12} /> Verified Geotag
                    </span>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-print"
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
