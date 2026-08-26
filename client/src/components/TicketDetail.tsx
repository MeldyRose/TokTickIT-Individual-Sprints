import React, { useState, useEffect } from "react";
import { fetchTicketDetail, TicketDetail as ITicketDetail } from "../api";
import { useRequester } from "../context/RequesterContext";
import { StatusBadge, PriorityBadge } from "./Badge";

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const { activeRequester } = useRequester();
  const [ticket, setTicket] = useState<ITicketDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs state for bottom section
  const [activeTab, setActiveTab] = useState<"comments" | "attachments" | "actions" | "events">("comments");

  // Local state for public comments
  const [comments, setComments] = useState<Array<{ id: string; author: string; role: string; text: string; date: string }>>([
    {
      id: "c-1",
      author: "Jennifer Anderson",
      role: "Requester",
      text: "Thank you for the update. Please let me know if you need any additional information.",
      date: "May 13, 2025 11:45 AM",
    },
    {
      id: "c-2",
      author: "Michael Brown",
      role: "IT Support",
      text: "We are investigating the issue on your device. We'll update you shortly.",
      date: "May 13, 2025 10:30 AM",
    },
    {
      id: "c-3",
      author: "Jennifer Anderson",
      role: "Requester",
      text: "Just adding that this issue occurs even when I close all applications.",
      date: "May 12, 2025 09:20 AM",
    },
  ]);
  const [newComment, setNewComment] = useState<string>("");

  useEffect(() => {
    if (!activeRequester || !ticketId) return;
    setLoading(true);
    setError(null);
    fetchTicketDetail(ticketId, activeRequester.id)
      .then((data) => setTicket(data))
      .catch((err) => setError(err?.message || "Ticket not found or access denied"))
      .finally(() => setLoading(false));
  }, [ticketId, activeRequester]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeRequester) return;
    setComments((prev) => [
      {
        id: `c-${Date.now()}`,
        author: activeRequester.name,
        role: "Requester",
        text: newComment.trim(),
        date: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);
    setNewComment("");
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" data-testid="detail-loading">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading ticket details...</span>
        </div>
        <p className="small text-muted mt-2">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-5" style={{ maxWidth: 640 }}>
        <div className="card shadow-sm border-0 p-5 text-center" data-testid="detail-access-denied">
          <div className="text-danger mb-3" style={{ fontSize: 48 }}>🚫</div>
          <h2 className="h4 fw-bold text-dark mb-2">Access Denied or Ticket Not Found</h2>
          <p className="text-muted small mb-4">
            {error || "You do not have permission to view this ticket or it does not exist."}
          </p>
          <div>
            <button className="btn btn-success" onClick={onBack} data-testid="back-to-tickets-error-btn">
              Back to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 1080 }}>
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="small text-secondary">
          <span className="text-decoration-underline" style={{ cursor: "pointer" }} onClick={onBack}>
            My Tickets
          </span>{" "}
          &gt; <span className="fw-semibold text-dark">Ticket Details</span>
        </div>
        <button
          className="btn btn-outline-success btn-sm font-monospace fw-semibold px-3"
          onClick={onBack}
          data-testid="back-to-tickets-btn"
        >
          ← Back to My Tickets
        </button>
      </div>

      {/* Main Ticket Read-Only Metadata Card */}
      <div className="card shadow-sm border-0 p-4 mb-4" style={{ borderRadius: 12, backgroundColor: "#FFFFFF" }}>
        <div className="row g-3">
          {/* Row 1 */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">Ticket No.</label>
            <input
              type="text"
              className="form-control form-control-sm bg-light font-monospace fw-bold"
              readOnly
              value={ticket.ticketNumber}
              data-testid="detail-ticket-number"
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">Ticket Date</label>
            <input
              type="text"
              className="form-control form-control-sm bg-light"
              readOnly
              value={new Date(ticket.createdAt).toLocaleString()}
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">Category</label>
            <input
              type="text"
              className="form-control form-control-sm bg-light"
              readOnly
              value={ticket.category?.name || "Hardware"}
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">Related System</label>
            <input
              type="text"
              className="form-control form-control-sm bg-light"
              readOnly
              value={ticket.relatedSystem?.name || "Corporate Laptop"}
            />
          </div>

          {/* Row 2 */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">Requester</label>
            <input
              type="text"
              className="form-control form-control-sm bg-light"
              readOnly
              value={ticket.requester?.name || "Jennifer Anderson"}
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">Requested Priority</label>
            <div className="form-control form-control-sm bg-light d-flex align-items-center">
              <PriorityBadge priority={ticket.requestedPriority} />
            </div>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">IT Priority</label>
            <div className="form-control form-control-sm bg-light d-flex align-items-center">
              <PriorityBadge priority={ticket.itPriority} />
            </div>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">Current Status</label>
            <div className="form-control form-control-sm bg-light d-flex align-items-center">
              <StatusBadge status={ticket.currentStatus} />
            </div>
          </div>

          {/* Row 3 */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">Ticket Owner</label>
            <input
              type="text"
              className="form-control form-control-sm bg-light"
              readOnly
              value={ticket.requester?.name ? `${ticket.requester.name} (IT Support)` : "Michael Brown (IT Support)"}
            />
          </div>
          <div className="col-12 col-md-9">
            <label className="form-label small fw-semibold text-secondary mb-1">Summary</label>
            <input
              type="text"
              className="form-control form-control-sm bg-light fw-semibold"
              readOnly
              value={ticket.summary}
              data-testid="detail-summary"
            />
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label small fw-semibold text-secondary mb-1">Description</label>
            <textarea
              className="form-control form-control-sm bg-light font-monospace"
              rows={3}
              readOnly
              value={ticket.description || "No description provided."}
            />
          </div>

          {/* Resolution Summary */}
          <div className="col-12">
            <label className="form-label small fw-semibold text-secondary mb-1">Resolution Summary</label>
            <textarea
              className="form-control form-control-sm bg-light text-muted fst-italic"
              rows={2}
              readOnly
              value={
                ticket.currentStatus === "RESOLVED" || ticket.currentStatus === "CLOSED"
                  ? "Issue resolved."
                  : "No resolution summary available yet."
              }
            />
          </div>
        </div>
      </div>

      {/* Bottom Section Card with Tabs */}
      <div className="card shadow-sm border-0 p-4" style={{ borderRadius: 12, backgroundColor: "#FFFFFF" }}>
        <ul className="nav nav-tabs border-bottom mb-4">
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "comments" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`}
              onClick={() => setActiveTab("comments")}
            >
              💬 Public Comments <span className="badge bg-success ms-1">{comments.length}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "attachments" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`}
              onClick={() => setActiveTab("attachments")}
            >
              📎 Attachments <span className="badge bg-secondary ms-1">{ticket.attachments?.length || 0}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "actions" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`}
              onClick={() => setActiveTab("actions")}
            >
              🛠 Service Actions <span className="badge bg-secondary ms-1">1</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "events" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`}
              onClick={() => setActiveTab("events")}
            >
              ⏱ Event Log <span className="badge bg-secondary ms-1">6</span>
            </button>
          </li>
        </ul>

        {/* Tab 1: Public Comments */}
        {activeTab === "comments" && (
          <div>
            <form onSubmit={handleAddComment} className="mb-4">
              <label htmlFor="addComment" className="form-label small fw-semibold text-secondary">
                Add Comment
              </label>
              <div className="d-flex gap-2">
                <input
                  id="addComment"
                  type="text"
                  className="form-control"
                  placeholder="Type your comment here..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  data-testid="add-comment-input"
                />
                <button
                  type="submit"
                  className="btn text-white fw-semibold px-4 text-nowrap"
                  style={{ backgroundColor: "#006B3C" }}
                  disabled={!newComment.trim()}
                  data-testid="post-comment-btn"
                >
                  ➤ Post Comment
                </button>
              </div>
            </form>

            <div className="d-flex flex-column gap-3">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded border bg-light d-flex gap-3 align-items-start">
                  <div
                    className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: c.role === "IT Support" ? "#0B7A46" : "#2D6A4F",
                    }}
                  >
                    {c.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold small text-dark">{c.author}</span>
                        <span
                          className={`badge ${c.role === "IT Support" ? "bg-success" : "bg-secondary"}`}
                          style={{ fontSize: 10 }}
                        >
                          {c.role}
                        </span>
                      </div>
                      <span className="small text-muted">{c.date}</span>
                    </div>
                    <p className="mb-0 small text-secondary">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Attachments Placeholder */}
        {activeTab === "attachments" && (
          <div>
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <ul className="list-group">
                {ticket.attachments.map((att) => (
                  <li key={att.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>📎 {att.fileName} ({(att.fileSize / 1024).toFixed(1)} KB)</span>
                    <span className="small text-muted">{new Date(att.uploadedAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 bg-light rounded text-center text-muted small" data-testid="empty-attachments">
                No active attachments uploaded for this ticket.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Service Actions Placeholder */}
        {activeTab === "actions" && (
          <div className="p-3 bg-light rounded text-muted small">
            <span className="fw-bold">Default Action:</span> Ticket assigned to IT Support Queue.
          </div>
        )}

        {/* Tab 4: Event Log Placeholder */}
        {activeTab === "events" && (
          <div className="table-responsive">
            <table className="table table-sm small align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Timestamp</th>
                  <th>Event Name</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                  <td><span className="badge bg-success">TICKET_CREATED</span> Ticket logged into TockTickIT</td>
                  <td>{ticket.requester?.name}</td>
                </tr>
                <tr>
                  <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                  <td><span className="badge bg-info text-dark">STATUS_SET</span> Current status set to NEW</td>
                  <td>System Auto-Assign</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
