import React, { useState, useEffect } from "react";
import {
  fetchTicketDetail,
  fetchPublicComments,
  postPublicComment,
  updateRequesterTicketStatus,
  TicketDetail as ITicketDetail,
  AttachmentMetadata,
  PublicComment,
  uploadAttachment,
  downloadAttachment,
  softRemoveAttachment,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import { InternalNotesSection } from "../components/InternalNotesSection";

interface RequesterTicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

export const RequesterTicketDetail: React.FC<RequesterTicketDetailProps> = ({ ticketId, onBack }) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<ITicketDetail | null>(null);
  const [attachments, setAttachments] = useState<AttachmentMetadata[]>([]);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Attachment upload & soft remove state
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [removeModalAttachment, setRemoveModalAttachment] = useState<AttachmentMetadata | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removeSubmitting, setRemoveSubmitting] = useState<boolean>(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<"comments" | "attachments" | "events">("comments");

  // Public comments state
  const [newComment, setNewComment] = useState<string>("");
  const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Resolution modal state
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [resolveSubmitting, setResolveSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!user || !ticketId) return;
    setLoading(true);
    setError(null);

    Promise.all([fetchTicketDetail(ticketId), fetchPublicComments(ticketId).catch(() => [])])
      .then(([ticketData, commentsData]) => {
        setTicket(ticketData);
        setAttachments(ticketData.attachments || []);
        setComments(commentsData || []);
      })
      .catch((err) => setError(err?.message || "Ticket not found or access denied"))
      .finally(() => setLoading(false));
  }, [ticketId, user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !ticketId) return;

    setUploadError(null);

    const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["jpg", "jpeg", "png", "webp", "pdf"];

    if (!allowedMime.includes(file.type) && (!ext || !allowedExts.includes(ext))) {
      setUploadError("File type not permitted or file size exceeds 5MB limit");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File type not permitted or file size exceeds 5MB limit");
      e.target.value = "";
      return;
    }

    const activeCount = attachments.filter((a) => !a.deletedAt).length;
    if (activeCount >= 5) {
      setUploadError("Maximum active attachments limit (5) reached for this ticket");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const newAtt = await uploadAttachment(ticketId, file);
      setAttachments((prev) => [...prev, newAtt]);
      e.target.value = "";
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      await downloadAttachment(attachmentId, fileName);
    } catch (err: any) {
      alert(err?.message || "Download failed");
    }
  };

  const openRemoveModal = (att: AttachmentMetadata) => {
    setRemoveModalAttachment(att);
    setRemovalReason("");
  };

  const closeRemoveModal = () => {
    if (removeSubmitting) return;
    setRemoveModalAttachment(null);
    setRemovalReason("");
  };

  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeModalAttachment || !removalReason.trim()) return;

    setRemoveSubmitting(true);
    try {
      const updatedAtt = await softRemoveAttachment(removeModalAttachment.id, removalReason);
      setAttachments((prev) =>
        prev.map((a) => (a.id === updatedAtt.id ? { ...a, ...updatedAtt } : a))
      );
      closeRemoveModal();
    } catch (err: any) {
      alert(err?.message || "Failed to remove attachment");
    } finally {
      setRemoveSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !ticketId || commentSubmitting) return;

    setCommentError(null);
    setCommentSubmitting(true);
    try {
      const created = await postPublicComment(ticketId, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err: any) {
      setCommentError(err?.message || "Failed to post comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleResolveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || resolveSubmitting) return;

    setResolveSubmitting(true);
    try {
      const res = await updateRequesterTicketStatus(
        ticketId,
        "WAITING_FOR_REQUESTER",
        resolutionNote.trim() || "Problem appears resolved by Requester."
      );
      if (ticket) {
        setTicket({ ...ticket, currentStatus: res.currentStatus });
      }
      const updatedComments = await fetchPublicComments(ticketId).catch(() => comments);
      setComments(updatedComments);
      setShowResolveModal(false);
      setResolutionNote("");
    } catch (err: any) {
      alert(err?.message || "Failed to update ticket status");
    } finally {
      setResolveSubmitting(false);
    }
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

  const isActiveTicket = ["OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "NEW"].includes(ticket.currentStatus);

  return (
    <div className="container py-4" style={{ maxWidth: 1080 }}>
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
        <div className="small text-secondary">
          <span className="text-decoration-underline" style={{ cursor: "pointer" }} onClick={onBack}>
            My Tickets
          </span>{" "}
          &gt; <span className="fw-semibold text-dark">Ticket Details</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Problem Appears Resolved Action Button (AC-09, BR-05) */}
          {isActiveTicket && (
            <button
              className="btn text-white btn-sm fw-semibold px-3"
              style={{ backgroundColor: "#006B3C" }}
              onClick={() => setShowResolveModal(true)}
              data-testid="problem-resolved-btn"
            >
              ✓ Problem Appears Resolved
            </button>
          )}

          <button
            className="btn btn-outline-success btn-sm font-monospace fw-semibold px-3"
            onClick={onBack}
            data-testid="back-to-tickets-btn"
          >
            ← Back to My Tickets
          </button>
        </div>
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

          {/* Summary */}
          <div className="col-12">
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

      {/* Bottom Section Card: Public Comments & Attachments (AC-04: Internal Notes EXCLUDED) */}
      <div className="card shadow-sm border-0 p-4" style={{ borderRadius: 12, backgroundColor: "#FFFFFF" }}>
        <ul className="nav nav-tabs border-bottom mb-4">
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "comments" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`}
              onClick={() => setActiveTab("comments")}
              data-testid="tab-comments"
            >
              💬 Public Comments <span className="badge bg-success ms-1">{comments.length}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "attachments" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`}
              onClick={() => setActiveTab("attachments")}
              data-testid="tab-attachments"
            >
              📎 Attachments <span className="badge bg-secondary ms-1">{attachments.filter((a) => !a.deletedAt).length}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "events" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`}
              onClick={() => setActiveTab("events")}
              data-testid="tab-events"
            >
              ⏱ Event Log
            </button>
          </li>
        </ul>

        {/* Tab 1: Public Comments */}
        {activeTab === "comments" && (
          <div data-testid="public-comments-section">
            <form onSubmit={handleAddComment} className="mb-4">
              <label htmlFor="addComment" className="form-label small fw-semibold text-secondary">
                Add Public Comment
              </label>
              <div className="d-flex flex-column gap-2">
                <textarea
                  id="addComment"
                  className="form-control"
                  rows={3}
                  placeholder="Type your comment here (max 2,000 characters)..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={2000}
                  data-testid="add-comment-input"
                />
                <div className="d-flex align-items-center justify-content-between">
                  <span className="small text-muted">{newComment.length} / 2000 characters</span>
                  <button
                    type="submit"
                    className="btn text-white fw-semibold px-4 text-nowrap"
                    style={{ backgroundColor: "#006B3C" }}
                    disabled={!newComment.trim() || commentSubmitting}
                    data-testid="post-comment-btn"
                  >
                    {commentSubmitting ? "Posting..." : "➤ Post Comment"}
                  </button>
                </div>
              </div>
              {commentError && (
                <div className="alert alert-danger small mt-2 py-2" role="alert">
                  {commentError}
                </div>
              )}
            </form>

            <div className="d-flex flex-column gap-3" data-testid="comments-thread">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="p-3 rounded border bg-light d-flex gap-3 align-items-start" data-testid={`comment-item-${c.id}`}>
                    <div
                      className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: c.author?.role === "IT_STAFF" ? "#0B7A46" : "#2D6A4F",
                      }}
                    >
                      {(c.author?.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small text-dark">{c.author?.name}</span>
                          <span
                            className={`badge ${c.author?.role === "IT_STAFF" ? "bg-success" : "bg-secondary"}`}
                            style={{ fontSize: 10 }}
                          >
                            {c.author?.role === "IT_STAFF" ? "IT Support" : "Requester"}
                          </span>
                        </div>
                        <span className="small text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mb-0 small text-secondary">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-light rounded text-center text-muted small" data-testid="empty-comments">
                  No public comments posted yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Attachments Section */}
        {activeTab === "attachments" && (
          <div data-testid="attachments-section">
            <div className="p-3 mb-4 rounded border bg-light">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <h6 className="fw-bold text-dark mb-1">Upload Supporting Evidence</h6>
                  <p className="small text-muted mb-0">
                    Permitted formats: <strong>JPG, PNG, WEBP, PDF</strong>. Max size: <strong>5 MB</strong>. Limit: <strong>5 active attachments</strong>.
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="file"
                    id="attachment-file-input"
                    className="d-none"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                    data-testid="file-upload-input"
                  />
                  <label
                    htmlFor="attachment-file-input"
                    className={`btn text-white fw-semibold btn-sm text-nowrap mb-0 ${uploading ? "disabled opacity-75" : ""}`}
                    style={{ backgroundColor: "#006B3C", cursor: "pointer" }}
                    data-testid="select-file-btn"
                  >
                    {uploading ? "Uploading..." : "📎 Choose & Upload File"}
                  </label>
                </div>
              </div>
              {uploadError && (
                <div className="alert alert-danger small mb-0 mt-3 p-2" role="alert" data-testid="upload-error-alert">
                  ⚠️ {uploadError}
                </div>
              )}
            </div>

            {attachments && attachments.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {attachments.map((att) => {
                  const isRemoved = !!att.deletedAt;
                  return (
                    <div
                      key={att.id}
                      className={`p-3 rounded border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 ${
                        isRemoved ? "bg-light text-muted border-secondary opacity-75" : "bg-white"
                      }`}
                      data-testid={`attachment-item-${att.id}`}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span style={{ fontSize: 24 }}>{isRemoved ? "📄" : "📎"}</span>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`fw-semibold ${isRemoved ? "text-decoration-line-through text-muted" : "text-dark"}`}>
                              {att.fileName}
                            </span>
                            {isRemoved ? (
                              <span className="badge bg-secondary" data-testid="removed-badge">Soft Removed</span>
                            ) : (
                              <span className="badge bg-success" style={{ fontSize: 10 }}>Active</span>
                            )}
                          </div>
                          <div className="small text-muted mt-1">
                            {(att.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(att.uploadedAt).toLocaleString()}
                          </div>
                          {isRemoved && att.removalReason && (
                            <div className="small text-danger fst-italic mt-1" data-testid="removal-reason-display">
                              Reason for removal: "{att.removalReason}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                        {isRemoved ? (
                          <button
                            className="btn btn-sm btn-outline-secondary disabled"
                            disabled
                            title="Soft-removed attachment cannot be downloaded"
                            data-testid={`download-disabled-btn-${att.id}`}
                          >
                            🚫 Download Blocked
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleDownload(att.id, att.fileName)}
                              data-testid={`download-btn-${att.id}`}
                            >
                              ⬇ Download
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => openRemoveModal(att)}
                              data-testid={`remove-btn-${att.id}`}
                            >
                              🗑 Soft Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-light rounded text-center text-muted small" data-testid="empty-attachments">
                No active attachments uploaded for this ticket.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Event Log */}
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      {user?.role !== "REQUESTER" && (
        <div className="mt-4">
          <InternalNotesSection ticketId={ticketId} />
        </div>
      )}

      {/* Problem Appears Resolved Modal */}
      {showResolveModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          tabIndex={-1}
          role="dialog"
          data-testid="problem-resolved-modal"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title text-success fw-bold">Indicate Problem Appears Resolved</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResolveModal(false)}
                  disabled={resolveSubmitting}
                />
              </div>
              <form onSubmit={handleResolveAction}>
                <div className="modal-body py-3">
                  <p className="small text-secondary mb-3">
                    Let IT Staff know that your problem appears resolved. The ticket status will update to{" "}
                    <strong>WAITING_FOR_REQUESTER</strong> to request review.
                  </p>
                  <div className="mb-3">
                    <label htmlFor="resolutionNoteInput" className="form-label small fw-semibold text-dark">
                      Resolution Note / Comment (Optional)
                    </label>
                    <textarea
                      id="resolutionNoteInput"
                      className="form-control form-control-sm"
                      rows={3}
                      placeholder="Add an optional comment regarding resolution..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      data-testid="resolution-note-input"
                    />
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowResolveModal(false)}
                    disabled={resolveSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success btn-sm text-white fw-semibold"
                    disabled={resolveSubmitting}
                    data-testid="confirm-resolved-btn"
                  >
                    {resolveSubmitting ? "Submitting..." : "Confirm & Notify IT Staff"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Soft Remove Modal */}
      {removeModalAttachment && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          tabIndex={-1}
          role="dialog"
          data-testid="soft-remove-modal"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title text-danger fw-bold">Soft Remove Attachment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeRemoveModal}
                  disabled={removeSubmitting}
                />
              </div>
              <form onSubmit={handleConfirmRemove}>
                <div className="modal-body py-3">
                  <p className="small text-secondary mb-3">
                    Are you sure you want to remove <strong>{removeModalAttachment.fileName}</strong>?
                    The file metadata will remain visible on Ticket Detail, but binary downloading will be permanently blocked.
                  </p>
                  <div className="mb-3">
                    <label htmlFor="removalReasonInput" className="form-label small fw-semibold text-dark">
                      Reason for Removal <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="removalReasonInput"
                      className="form-control form-control-sm"
                      rows={3}
                      placeholder="Please specify why this attachment is being removed..."
                      value={removalReason}
                      onChange={(e) => setRemovalReason(e.target.value)}
                      required
                      data-testid="removal-reason-input"
                    />
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={closeRemoveModal}
                    disabled={removeSubmitting}
                    data-testid="cancel-remove-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm text-white fw-semibold"
                    disabled={!removalReason.trim() || removeSubmitting}
                    data-testid="confirm-remove-btn"
                  >
                    {removeSubmitting ? "Removing..." : "Confirm Removal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
