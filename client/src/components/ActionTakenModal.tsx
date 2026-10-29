import React, { useState, useEffect } from "react";
import {
  ActionTaken,
  CreateActionTakenInput,
  UpdateActionTakenInput,
  createTicketAction,
  updateTicketAction,
} from "../api";
import { useAuth } from "../context/AuthContext";

interface ActionTakenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (action: ActionTaken) => void;
  ticketId: string;
  actionToEdit?: ActionTaken | null;
  ticketIsUnassigned?: boolean;
}

export const ActionTakenModal: React.FC<ActionTakenModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ticketId,
  actionToEdit,
  ticketIsUnassigned = false,
}) => {
  const { user } = useAuth();
  const isEditing = !!actionToEdit;

  const getNowLocalDatetime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const local = new Date(now.getTime() - offset);
    return local.toISOString().slice(0, 16);
  };

  const formatInitialDatetime = (isoStr?: string) => {
    if (!isoStr) return getNowLocalDatetime();
    try {
      const d = new Date(isoStr);
      const offset = d.getTimezoneOffset() * 60000;
      const local = new Date(d.getTime() - offset);
      return local.toISOString().slice(0, 16);
    } catch {
      return getNowLocalDatetime();
    }
  };

  const [actionDateTime, setActionDateTime] = useState<string>(formatInitialDatetime(actionToEdit?.actionDateTime));
  const [description, setDescription] = useState<string>(actionToEdit?.description || "");
  const [result, setResult] = useState<string>(actionToEdit?.result || "");
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(actionToEdit?.followUpRequired || false);
  const [followUpNote, setFollowUpNote] = useState<string>(actionToEdit?.followUpNote || "");
  const [attachmentNotes, setAttachmentNotes] = useState<string>(actionToEdit?.attachmentNotes || "");
  const [claimTicket, setClaimTicket] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (actionToEdit) {
      setActionDateTime(formatInitialDatetime(actionToEdit.actionDateTime));
      setDescription(actionToEdit.description || "");
      setResult(actionToEdit.result || "");
      setFollowUpRequired(actionToEdit.followUpRequired || false);
      setFollowUpNote(actionToEdit.followUpNote || "");
      setAttachmentNotes(actionToEdit.attachmentNotes || "");
      setClaimTicket(false);
    } else {
      setActionDateTime(getNowLocalDatetime());
      setDescription("");
      setResult("");
      setFollowUpRequired(false);
      setFollowUpNote("");
      setAttachmentNotes("");
      setClaimTicket(false);
    }
    setFieldErrors({});
    setApiError(null);
  }, [actionToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!actionDateTime) {
      errors.actionDateTime = "Action date and time is required.";
    }

    if (!description.trim()) {
      errors.description = "Action description is required (minimum 10 characters).";
    } else if (description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters long.";
    } else if (description.trim().length > 2000) {
      errors.description = "Description cannot exceed 2000 characters.";
    }

    if (!result.trim()) {
      errors.result = "Result is required (minimum 3 characters).";
    } else if (result.trim().length < 3) {
      errors.result = "Result must be at least 3 characters long.";
    } else if (result.trim().length > 500) {
      errors.result = "Result cannot exceed 500 characters.";
    }

    if (followUpRequired) {
      if (!followUpNote.trim()) {
        errors.followUpNote = "Follow-up note is required when follow-up is requested (minimum 5 characters).";
      } else if (followUpNote.trim().length < 5) {
        errors.followUpNote = "Follow-up note must be at least 5 characters long.";
      } else if (followUpNote.trim().length > 1000) {
        errors.followUpNote = "Follow-up note cannot exceed 1000 characters.";
      }
    }

    if (attachmentNotes && attachmentNotes.trim().length > 500) {
      errors.attachmentNotes = "Attachment notes cannot exceed 500 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const isoDateTime = actionDateTime ? new Date(actionDateTime).toISOString() : new Date().toISOString();

      if (isEditing && actionToEdit) {
        const payload: UpdateActionTakenInput = {
          actionDateTime: isoDateTime,
          description: description.trim(),
          result: result.trim(),
          followUpRequired,
          followUpNote: followUpRequired ? followUpNote.trim() : null,
          attachmentNotes: attachmentNotes.trim() ? attachmentNotes.trim() : null,
          expectedUpdatedAt: actionToEdit.updatedAt,
        };
        const response = await updateTicketAction(ticketId, actionToEdit.id, payload);
        onSuccess(response.action);
        onClose();
      } else {
        const payload: CreateActionTakenInput = {
          actionDateTime: isoDateTime,
          description: description.trim(),
          result: result.trim(),
          followUpRequired,
          followUpNote: followUpRequired ? followUpNote.trim() : null,
          attachmentNotes: attachmentNotes.trim() ? attachmentNotes.trim() : null,
          claimTicket: ticketIsUnassigned ? claimTicket : false,
        };
        const response = await createTicketAction(ticketId, payload);
        onSuccess(response.action);
        onClose();
      }
    } catch (err: any) {
      if (err?.status === 409 || err?.code === "STALE_UPDATE") {
        setApiError("Update conflict: This action record has been modified by another user. Please refresh and review.");
      } else {
        setApiError(err?.message || "An unexpected error occurred while saving the action.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1055 }}
      data-testid="action-taken-modal"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content shadow border-0" style={{ borderRadius: "12px", overflow: "hidden" }}>
          <div
            className="modal-header text-white"
            style={{ backgroundColor: "#006B3C", borderBottom: "1px solid #0B7A46" }}
          >
            <h5 className="modal-title fw-bold" data-testid="modal-title">
              {isEditing ? "✏️ Edit Action Taken" : "🛠️ Log Action Taken"}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              onClick={onClose}
              disabled={submitting}
              data-testid="modal-close-btn"
            />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body p-4" style={{ backgroundColor: "#FFFFFF" }}>
              {apiError && (
                <div className="alert alert-danger d-flex align-items-center mb-3" role="alert" data-testid="modal-error-alert">
                  <div>{apiError}</div>
                </div>
              )}

              {/* Performer auto-attribution banner */}
              <div
                className="p-3 mb-3 rounded d-flex align-items-center justify-content-between"
                style={{ backgroundColor: "#EAF6EF", border: "1px solid #D8E0DC" }}
                data-testid="performer-banner"
              >
                <div>
                  <span className="small text-muted d-block">Performed By</span>
                  <span className="fw-semibold text-dark" data-testid="performer-name">
                    {user?.name || "Current User"}
                  </span>
                </div>
                <span
                  className="badge px-2 py-1 rounded-pill"
                  style={{ backgroundColor: "#006B3C", color: "#FFFFFF" }}
                  data-testid="performer-role-badge"
                >
                  {user?.role === "ADMINISTRATOR" ? "Administrator" : "IT Staff"}
                </span>
              </div>

              {/* Action Date / Time */}
              <div className="mb-3">
                <label htmlFor="actionDateTime" className="form-label fw-semibold small text-secondary">
                  Action Date & Time <span className="text-danger">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="actionDateTime"
                  name="actionDateTime"
                  className={`form-control ${fieldErrors.actionDateTime ? "is-invalid" : ""}`}
                  value={actionDateTime}
                  onChange={(e) => {
                    setActionDateTime(e.target.value);
                    if (fieldErrors.actionDateTime) {
                      setFieldErrors((prev) => ({ ...prev, actionDateTime: "" }));
                    }
                  }}
                  disabled={submitting}
                  data-testid="action-datetime-input"
                  required
                />
                {fieldErrors.actionDateTime && (
                  <div className="invalid-feedback d-block" data-testid="action-datetime-error">
                    {fieldErrors.actionDateTime}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="actionDescription" className="form-label fw-semibold small text-secondary mb-0">
                    Action Description <span className="text-danger">*</span>
                  </label>
                  <span className="small text-muted">{description.length} / 2000 chars (min 10)</span>
                </div>
                <textarea
                  id="actionDescription"
                  name="description"
                  rows={4}
                  className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
                  placeholder="Describe the concrete technical steps or remediation actions performed..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (fieldErrors.description) {
                      setFieldErrors((prev) => ({ ...prev, description: "" }));
                    }
                  }}
                  disabled={submitting}
                  data-testid="action-description-input"
                  required
                />
                {fieldErrors.description && (
                  <div className="invalid-feedback d-block" data-testid="action-description-error">
                    {fieldErrors.description}
                  </div>
                )}
              </div>

              {/* Result */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="actionResult" className="form-label fw-semibold small text-secondary mb-0">
                    Result / Outcome <span className="text-danger">*</span>
                  </label>
                  <span className="small text-muted">{result.length} / 500 chars (min 3)</span>
                </div>
                <textarea
                  id="actionResult"
                  name="result"
                  rows={2}
                  className={`form-control ${fieldErrors.result ? "is-invalid" : ""}`}
                  placeholder="Observed technical result, diagnostic output, or error state change..."
                  value={result}
                  onChange={(e) => {
                    setResult(e.target.value);
                    if (fieldErrors.result) {
                      setFieldErrors((prev) => ({ ...prev, result: "" }));
                    }
                  }}
                  disabled={submitting}
                  data-testid="action-result-input"
                  required
                />
                {fieldErrors.result && (
                  <div className="invalid-feedback d-block" data-testid="action-result-error">
                    {fieldErrors.result}
                  </div>
                )}
              </div>

              {/* Follow-up Required Toggle */}
              <div className="form-check form-switch mb-3 p-2 ps-5 rounded" style={{ backgroundColor: "#F8F9FA" }}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="followUpRequired"
                  checked={followUpRequired}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFollowUpRequired(checked);
                    if (!checked) {
                      setFieldErrors((prev) => ({ ...prev, followUpNote: "" }));
                    }
                  }}
                  disabled={submitting}
                  data-testid="follow-up-toggle"
                />
                <label className="form-check-label fw-semibold text-dark user-select-none" htmlFor="followUpRequired">
                  Follow-Up Required?
                </label>
                <div className="small text-muted">
                  Check this if further investigation, part procurement, or verification is pending.
                </div>
              </div>

              {/* Conditional Follow-up Note */}
              {followUpRequired && (
                <div className="mb-3 p-3 rounded" style={{ backgroundColor: "#FFF8E1", border: "1px solid #FFE082" }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="followUpNote" className="form-label fw-semibold small text-dark mb-0">
                      Follow-up Note <span className="text-danger">*</span>
                    </label>
                    <span className="small text-muted">{followUpNote.length} / 1000 chars (min 5)</span>
                  </div>
                  <textarea
                    id="followUpNote"
                    name="followUpNote"
                    rows={2}
                    className={`form-control ${fieldErrors.followUpNote ? "is-invalid" : ""}`}
                    placeholder="Specify the pending task, required hardware parts, or next steps..."
                    value={followUpNote}
                    onChange={(e) => {
                      setFollowUpNote(e.target.value);
                      if (fieldErrors.followUpNote) {
                        setFieldErrors((prev) => ({ ...prev, followUpNote: "" }));
                      }
                    }}
                    disabled={submitting}
                    data-testid="follow-up-note-input"
                    required={followUpRequired}
                  />
                  {fieldErrors.followUpNote && (
                    <div className="invalid-feedback d-block" data-testid="follow-up-note-error">
                      {fieldErrors.followUpNote}
                    </div>
                  )}
                </div>
              )}

              {/* Attachment Notes */}
              <div className="mb-3">
                <label htmlFor="attachmentNotes" className="form-label fw-semibold small text-secondary">
                  Attachment References / Diagnostic Notes <span className="text-muted fw-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="attachmentNotes"
                  name="attachmentNotes"
                  className={`form-control ${fieldErrors.attachmentNotes ? "is-invalid" : ""}`}
                  placeholder="e.g. wireshark_trace_port24.pcapng, log_capture_01.txt"
                  value={attachmentNotes}
                  onChange={(e) => {
                    setAttachmentNotes(e.target.value);
                    if (fieldErrors.attachmentNotes) {
                      setFieldErrors((prev) => ({ ...prev, attachmentNotes: "" }));
                    }
                  }}
                  maxLength={500}
                  disabled={submitting}
                  data-testid="attachment-notes-input"
                />
                {fieldErrors.attachmentNotes && (
                  <div className="invalid-feedback d-block" data-testid="attachment-notes-error">
                    {fieldErrors.attachmentNotes}
                  </div>
                )}
              </div>

              {/* Claim Ticket Checkbox (Create only & Unassigned ticket only) */}
              {!isEditing && ticketIsUnassigned && (
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="claimTicket"
                    checked={claimTicket}
                    onChange={(e) => setClaimTicket(e.target.checked)}
                    disabled={submitting}
                    data-testid="claim-ticket-checkbox"
                  />
                  <label className="form-check-label fw-semibold text-dark" htmlFor="claimTicket">
                    Assign this ticket to me (Claim Ticket)
                  </label>
                </div>
              )}
            </div>

            <div className="modal-footer bg-light border-top">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={submitting}
                data-testid="modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white fw-semibold d-flex align-items-center"
                style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                disabled={submitting}
                data-testid="modal-submit-btn"
              >
                {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />}
                {isEditing ? "Save Action Taken" : "Log Action Taken"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
