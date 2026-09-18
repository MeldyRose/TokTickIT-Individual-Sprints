import React, { useState, useEffect } from "react";
import { fetchInternalNotes, postInternalNote, InternalNote } from "../api";
import { useAuth } from "../context/AuthContext";

interface InternalNotesSectionProps {
  ticketId: string;
}

export const InternalNotesSection: React.FC<InternalNotesSectionProps> = ({ ticketId }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newNote, setNewNote] = useState<string>("");
  const [noteSubmitting, setNoteSubmitting] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Security Scoping: Do NOT render for Requesters
  if (!user || user.role === "REQUESTER") {
    return null;
  }

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);

    fetchInternalNotes(ticketId)
      .then((data) => setNotes(data || []))
      .catch((err) => setError(err?.message || "Failed to load internal notes"))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !ticketId || noteSubmitting) return;

    if (newNote.trim().length > 2000) {
      setNoteError("Note content must be 2,000 characters or less");
      return;
    }

    setNoteError(null);
    setNoteSubmitting(true);

    try {
      const created = await postInternalNote(ticketId, newNote.trim());
      setNotes((prev) => [...prev, created]);
      setNewNote("");
    } catch (err: any) {
      setNoteError(err?.message || "Failed to post note");
    } finally {
      setNoteSubmitting(false);
    }
  };

  return (
    <div
      className="p-4 rounded border mb-4"
      style={{
        backgroundColor: "#FFFDE7",
        borderColor: "#FFE082",
      }}
      data-testid="internal-notes-section"
    >
      {/* Header Warning Badge */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="fw-bold mb-0 text-warning-emphasis d-flex align-items-center gap-2" style={{ color: "#795548" }}>
          <span>🔒</span> Internal Notes (IT Staff & Admin Only)
        </h6>
        <span className="badge bg-warning text-dark font-monospace" data-testid="internal-notes-lock-badge">
          🔒 Confidential
        </span>
      </div>

      <p className="small text-muted mb-3">
        Internal notes are visible strictly to IT Staff and Administrators. They are never exposed to Requesters.
      </p>

      {/* Add Internal Note Form */}
      <form onSubmit={handleAddNote} className="mb-4">
        <label htmlFor="addInternalNote" className="form-label small fw-semibold text-dark">
          Add Operational Internal Note
        </label>
        <div className="d-flex flex-column gap-2">
          <textarea
            id="addInternalNote"
            className="form-control"
            rows={3}
            placeholder="Type private operational notes here (max 2,000 characters)..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            maxLength={2000}
            data-testid="add-note-input"
          />
          <div className="d-flex align-items-center justify-content-between">
            <span className="small text-muted">{newNote.length} / 2000 characters</span>
            <button
              type="submit"
              className="btn btn-warning btn-sm text-dark fw-bold px-4 text-nowrap"
              disabled={!newNote.trim() || noteSubmitting}
              data-testid="post-note-btn"
            >
              {noteSubmitting ? "Posting Note..." : "🔒 Post Internal Note"}
            </button>
          </div>
        </div>
        {noteError && (
          <div className="alert alert-danger small mt-2 py-2" role="alert" data-testid="note-error-alert">
            {noteError}
          </div>
        )}
      </form>

      {/* Notes List */}
      {loading ? (
        <div className="text-center py-3 text-muted small" data-testid="notes-loading">
          Loading internal notes...
        </div>
      ) : error ? (
        <div className="alert alert-danger small py-2" role="alert" data-testid="notes-error">
          {error}
        </div>
      ) : (
        <div className="d-flex flex-column gap-3" data-testid="notes-thread">
          {notes.length > 0 ? (
            notes.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded border bg-white d-flex gap-3 align-items-start"
                style={{ borderColor: "#FFE082" }}
                data-testid={`note-item-${n.id}`}
              >
                <div
                  className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "#E65100",
                  }}
                >
                  {(n.author?.name || "U")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold small text-dark">{n.author?.name}</span>
                      <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>
                        {n.author?.role === "ADMINISTRATOR" ? "Admin" : "IT Staff"}
                      </span>
                    </div>
                    <span className="small text-muted">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mb-0 small text-secondary font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                    {n.content}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 bg-white rounded border border-warning-subtle text-center text-muted small" data-testid="empty-notes">
              No internal notes recorded for this ticket yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InternalNotesSection;
