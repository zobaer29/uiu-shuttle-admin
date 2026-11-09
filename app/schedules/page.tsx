"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { AdminShell, adminFetch, backendUrl } from "../admin-shell";

type Schedule = {
  id: string;
  route_id: string;
  route_name: string;
  direction: string;
  departure_time: string;
};

type Route = {
  id: string;
  name: string;
};

type PdfInfo = {
  exists: boolean;
  title?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  url?: string;
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [filterDirection, setFilterDirection] = useState<"all" | "outbound" | "return">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states for new departure
  const [routeId, setRouteId] = useState("");
  const [direction, setDirection] = useState<"outbound" | "return">("outbound");
  const [departureTime, setDepartureTime] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [schedulesRes, routesRes, pdfRes] = await Promise.all([
        adminFetch("/schedules"),
        adminFetch("/routes"),
        adminFetch("/schedules/pdf/info"),
      ]);

      if (schedulesRes.ok) {
        setSchedules(await schedulesRes.json());
      }
      if (routesRes.ok) {
        const routeData = await routesRes.json();
        setRoutes(routeData);
        if (routeData.length > 0 && !routeId) {
          setRouteId(routeData[0].id);
        }
      }
      if (pdfRes.ok) {
        setPdfInfo(await pdfRes.json());
      }
    } catch (err: any) {
      setError(err.message ?? "Unable to load schedule data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleFileUpload(file: File) {
    if (!file || file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await adminFetch("/schedules/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message ?? "Failed to upload PDF");
      }

      const updatedInfo = await response.json();
      setPdfInfo(updatedInfo);
      setMessage("✓ Time Schedule PDF uploaded and broadcasted to mobile users successfully!");
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message ?? "Error uploading PDF");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePdf() {
    if (!confirm("Are you sure you want to remove the published schedule PDF?")) return;

    try {
      const response = await adminFetch("/schedules/pdf", { method: "DELETE" });
      if (response.ok) {
        setPdfInfo({ exists: false });
        setShowPreview(false);
        setMessage("Schedule PDF removed.");
      }
    } catch (err: any) {
      setError("Unable to delete schedule PDF");
    }
  }

  async function handleCreateSchedule(e: FormEvent) {
    e.preventDefault();
    if (!routeId || !departureTime) return;

    setMessage("");
    setError("");

    try {
      const response = await adminFetch("/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId,
          direction,
          departureTime: departureTime.length === 5 ? `${departureTime}:00` : departureTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save departure time");
      }

      setMessage("✓ New departure time added.");
      setDepartureTime("");
      await loadData();
    } catch (err: any) {
      setError(err.message ?? "Failed to add departure");
    }
  }

  async function handleDeleteSchedule(id: string, routeName: string, time: string) {
    if (!confirm(`Delete departure ${time} for ${routeName}?`)) return;

    try {
      const response = await adminFetch(`/schedules/${id}`, { method: "DELETE" });
      if (response.ok) {
        setSchedules((prev) => prev.filter((item) => item.id !== id));
        setMessage("Departure deleted.");
      }
    } catch (err: any) {
      setError("Failed to delete schedule");
    }
  }

  const filteredSchedules = schedules.filter((item) => {
    const matchesDirection = filterDirection === "all" || item.direction === filterDirection;
    const matchesQuery = item.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.departure_time.includes(searchQuery);
    return matchesDirection && matchesQuery;
  });

  return (
    <AdminShell title="Time Schedule of Shuttle Services">
      <p className="page-intro">
        Manage official PDF timetables and published departure schedules. Any updates uploaded here are automatically synced to student and driver apps in real time.
      </p>

      {message && <p className="form-message" style={{ padding: "10px 14px", background: "#eaf4ed", borderRadius: 8 }}>{message}</p>}
      {error && <p className="login-error" style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 8 }}>{error}</p>}

      {/* Top Cards: PDF Manager & Add Departure Form */}
      <div className="schedule-header-grid">
        {/* PDF Timetable Card */}
        <div className="pdf-manager-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)" }}>Official Timetable Document (PDF)</h3>
            <span className={`card-top-badge ${pdfInfo?.exists ? "badge-active" : "badge-empty"}`}>
              <span className="badge-dot" />
              {pdfInfo?.exists ? "Published & Live" : "No PDF Active"}
            </span>
          </div>

          <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 16px" }}>
            Upload the university-approved official PDF timetable. Students can view and download this directly in their mobile app.
          </p>

          {pdfInfo?.exists ? (
            <div>
              <div className="pdf-info-row">
                <div className="pdf-icon-circle">📄</div>
                <div className="pdf-details" style={{ flex: 1 }}>
                  <h4>{pdfInfo.title || "Time Schedule of Shuttle Services"}</h4>
                  <p>
                    <strong>File:</strong> {pdfInfo.originalName || pdfInfo.filename} ·{" "}
                    <strong>Size:</strong> {pdfInfo.size ? `${(pdfInfo.size / 1024).toFixed(1)} KB` : "Standard"} ·{" "}
                    <strong>Updated:</strong> {pdfInfo.uploadedAt ? new Date(pdfInfo.uploadedAt).toLocaleDateString() : "Active"}
                  </p>
                </div>
              </div>

              <div className="pdf-action-bar">
                <a
                  href={`${backendUrl}/schedules/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  ↗ Open / Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => setShowPreview((prev) => !prev)}
                  className="btn-secondary"
                >
                  {showPreview ? "Hide Preview" : "👁 Show Preview"}
                </button>
                <label className="btn-upload" style={{ cursor: "pointer" }}>
                  🔄 Replace PDF
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleDeletePdf}
                  className="btn-danger-outline"
                >
                  🗑 Remove
                </button>
              </div>

              {showPreview && (
                <div className="pdf-preview-container">
                  <iframe
                    src={`${backendUrl}/schedules/pdf`}
                    title="Time Schedule Preview"
                    className="pdf-iframe"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label
                className={`upload-dropzone ${uploading ? "dragging" : ""}`}
                style={{ display: "block" }}
              >
                <div className="dropzone-icon">📥</div>
                <strong style={{ display: "block", color: "var(--ink)", fontSize: 14 }}>
                  {uploading ? "Uploading official PDF..." : "Click to browse or drop Schedule PDF here"}
                </strong>
                <span style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, display: "block" }}>
                  Accepts official timetable documents (.pdf, up to 15MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: "none" }}
                  disabled={uploading}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Add Departure Departure Form Card */}
        <div className="pdf-manager-card">
          <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)" }}>Add Route Departure Time</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 16px" }}>
            Add published individual trip timings to the system database.
          </p>

          <form onSubmit={handleCreateSchedule} style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                Select Route
              </label>
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)" }}
                required
              >
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                  Direction
                </label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as "outbound" | "return")}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)" }}
                >
                  <option value="outbound">Outbound (To Campus)</option>
                  <option value="return">Return (From Campus)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                  Departure Time
                </label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line)" }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-upload"
              style={{ justifyContent: "center", marginTop: 8 }}
            >
              + Publish Departure Time
            </button>
          </form>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="schedule-filter-bar">
        <div className="filter-pills">
          <button
            type="button"
            className={`pill-btn ${filterDirection === "all" ? "active" : ""}`}
            onClick={() => setFilterDirection("all")}
          >
            All Departures ({schedules.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${filterDirection === "outbound" ? "active" : ""}`}
            onClick={() => setFilterDirection("outbound")}
          >
            Outbound to Campus
          </button>
          <button
            type="button"
            className={`pill-btn ${filterDirection === "return" ? "active" : ""}`}
            onClick={() => setFilterDirection("return")}
          >
            Return from Campus
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter route or time..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 20,
            border: "1px solid var(--line)",
            fontSize: 13,
            minWidth: 220,
          }}
        />
      </div>

      {/* Published Departures Table */}
      <div className="data-table">
        <div className="data-row data-head" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
          <strong>Route</strong>
          <strong>Direction</strong>
          <strong>Departure Time</strong>
          <strong>Action</strong>
        </div>

        {filteredSchedules.length > 0 ? (
          filteredSchedules.map((item) => (
            <div
              className="data-row"
              key={item.id}
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr", alignItems: "center" }}
            >
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{item.route_name}</span>
              <span>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: item.direction === "outbound" ? "#eff6ff" : "#fef3c7",
                    color: item.direction === "outbound" ? "#1d4ed8" : "#b45309",
                  }}
                >
                  {item.direction}
                </span>
              </span>
              <span style={{ fontWeight: 700, color: "#ff6500", fontSize: 14 }}>
                {item.departure_time.slice(0, 5)}
              </span>
              <span>
                <button
                  type="button"
                  onClick={() => handleDeleteSchedule(item.id, item.route_name, item.departure_time.slice(0, 5))}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </span>
            </div>
          ))
        ) : (
          <div className="empty-state">
            {loading ? "Loading schedules..." : "No scheduled departures matching current filter."}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
