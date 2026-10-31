import React, { useState, useEffect } from "react";
import { TicketStatus } from "../api";

export interface ErrorDetail {
  criterion: string;
  message: string;
}

interface StatusTransitionModalProps {
  targetStatus: TicketStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resolutionSummary?: string, comment?: string) => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  errorDetails?: ErrorDetail[] | null;
  actionsCount?: number | null;
  ticketNumber?: string;
}

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  targetStatus,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  errorMessage = null,
  errorDetails = null,
  actionsCount = null,
  ticketNumber,
}) => {
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [closureComment, setClosureComment] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setResolutionSummary("");
      setClosureComment("");
      setCancellationReason("");
      setTouched(false);
    }
  }, [isOpen, targetStatus]);

  if (!isOpen || !targetStatus) return null;

  const isResolving = targetStatus === "RESOLVED";
  const isClosing = targetStatus === "CLOSED";
  const isCancelling = targetStatus === "CANCELLED";

  // Check actions taken precondition from props or 422 error details
  const hasActionPrerequisiteFailure = errorDetails?.some(
    (d) => d.criterion === "MISSING_ACTION_TAKEN"
  );
  const effectiveActionsCount = hasActionPrerequisiteFailure ? 0 : actionsCount;
  const actionsSatisfied =
    effectiveActionsCount === null || effectiveActionsCount === undefined || effectiveActionsCount >= 1;

  const isResolutionValid =
    resolutionSummary.trim().length >= 10 && resolutionSummary.trim().length <= 2000;

  const canSubmit = isResolving
    ? isResolutionValid && actionsSatisfied
    : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || isSubmitting) return;

    if (isResolving) {
      onConfirm(resolutionSummary.trim(), undefined);
    } else if (isClosing) {
      onConfirm(undefined, closureComment.trim() || undefined);
    } else if (isCancelling) {
      onConfirm(undefined, cancellationReason.trim() || undefined);
    } else {
      onConfirm();
    }
  };

  const modalTestId = isResolving
    ? "resolve-modal"
    : isClosing
    ? "close-ticket-modal"
    : isCancelling
    ? "cancel-ticket-modal"
    : "status-transition-modal";

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1055 }}
      data-testid={modalTestId}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <form onSubmit={handleSubmit}>
            <div className="modal-header border-bottom py-3">
              <h5 className="modal-title fw-bold text-dark">
                {isResolving
                  ? "Confirm Ticket Resolution"
                  : isClosing
                  ? "Confirm Ticket Closure"
                  : isCancelling
                  ? "Confirm Ticket Cancellation"
                  : `Transition to ${targetStatus}`}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
                disabled={isSubmitting}
                data-testid={
                  isResolving
                    ? "cancel-resolve-btn"
                    : isClosing
                    ? "modal-close-x-btn"
                    : "cancel-transition-x-btn"
                }
              />
            </div>

            <div className="modal-body py-4">
              {errorMessage && (
                <div
                  className="alert alert-danger py-2 small mb-3"
                  role="alert"
                  data-testid="resolution-gate-error"
                >
                  <div className="fw-semibold">{errorMessage}</div>
                  {errorDetails && errorDetails.length > 0 && (
                    <ul className="mb-0 mt-1 ps-3" data-testid="resolution-gate-error-details">
                      {errorDetails.map((det, idx) => (
                        <li key={idx} data-testid={`gate-error-detail-${det.criterion.toLowerCase()}`}>
                          {det.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* RESOLVED: Resolution Gate Verification Checklist & Remediation Input (Spec 3.4 / 6.4) */}
              {isResolving && (
                <div>
                  {/* Live Verification Checklist */}
                  <div
                    className="mb-3 p-3 rounded"
                    style={{ backgroundColor: "#F8F9FA", border: "1px solid #E9ECEF" }}
                    data-testid="resolution-gate-checklist"
                  >
                    <div className="small fw-bold text-dark mb-2">Resolution Gate Prerequisites:</div>
                    
                    {/* Criterion 1: Actions Taken recorded */}
                    <div
                      className="d-flex align-items-center gap-2 mb-2 small"
                      data-testid="gate-criterion-actions"
                    >
                      {effectiveActionsCount === null || effectiveActionsCount === undefined ? (
                        <>
                          <span className="text-success fw-bold">✓</span>
                          <span className="text-muted">At least 1 Action Taken recorded</span>
                        </>
                      ) : effectiveActionsCount >= 1 ? (
                        <>
                          <span className="text-success fw-bold">✓</span>
                          <span className="text-success">
                            At least 1 Action Taken recorded ({effectiveActionsCount} logged)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-danger fw-bold">✕</span>
                          <span className="text-danger fw-semibold">
                            No Actions Taken logged. At least one action must be recorded before resolving.
                          </span>
                        </>
                      )}
                    </div>

                    {/* Criterion 2: Resolution Summary provided (min 10 characters) */}
                    <div
                      className="d-flex align-items-center gap-2 small"
                      data-testid="gate-criterion-summary"
                    >
                      {isResolutionValid ? (
                        <>
                          <span className="text-success fw-bold">✓</span>
                          <span className="text-success">
                            Resolution Summary provided ({resolutionSummary.trim().length} / 2000 characters)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-warning fw-bold">○</span>
                          <span className="text-muted">
                            Resolution Summary provided (min 10 characters)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="resolution-summary-field"
                      className="form-label small fw-semibold text-secondary mb-1"
                    >
                      Resolution Summary / Remediation Notes <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="resolution-summary-field"
                      className={`form-control ${
                        touched && !isResolutionValid ? "is-invalid" : ""
                      }`}
                      rows={4}
                      placeholder="Describe the root cause and the specific resolution steps performed to solve this issue..."
                      value={resolutionSummary}
                      onChange={(e) => {
                        setResolutionSummary(e.target.value);
                        setTouched(true);
                      }}
                      maxLength={2000}
                      disabled={isSubmitting}
                      data-testid="resolution-summary-input"
                      aria-label="Resolution Summary"
                    />
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <div
                        className="small text-muted"
                        data-testid="resolution-char-counter"
                      >
                        {resolutionSummary.length} / 2000 characters
                        {resolutionSummary.trim().length < 10 && (
                          <span className="text-warning ms-1">(Min 10 characters required)</span>
                        )}
                      </div>
                    </div>
                    {touched && resolutionSummary.trim().length < 10 && (
                      <div
                        className="text-danger small mt-1"
                        data-testid="resolution-summary-error"
                      >
                        Resolution summary must be at least 10 characters.
                      </div>
                    )}
                  </div>

                  <div
                    className="p-3 rounded small"
                    style={{ backgroundColor: "#EAF6EF", border: "1px solid #D8E0DC" }}
                  >
                    <div className="fw-semibold text-success mb-1">
                      ✓ Resolution Verification Step
                    </div>
                    <div className="text-muted">
                      Documenting the remediation details confirms that the underlying issue has been verified and remediated prior to closing.
                    </div>
                  </div>
                </div>
              )}

              {/* CLOSED: Formal Closure Review Dialog */}
              {isClosing && (
                <div>
                  <p className="text-muted mb-3">
                    Are you sure you want to formally close ticket {ticketNumber ? <strong>{ticketNumber}</strong> : "this ticket"}? This will mark the ticket as closed and finalize the record.
                  </p>
                  <div className="mb-3">
                    <label
                      htmlFor="close-notes-field"
                      className="form-label small fw-semibold text-secondary mb-1"
                    >
                      Closure Remarks (Optional — visible to requester)
                    </label>
                    <textarea
                      id="close-notes-field"
                      className="form-control"
                      rows={3}
                      placeholder="Add any final remarks or customer follow-up verification..."
                      value={closureComment}
                      onChange={(e) => setClosureComment(e.target.value)}
                      disabled={isSubmitting}
                      data-testid="close-notes-input"
                      aria-label="Closure Remarks"
                    />
                    <div className="form-text small text-muted">
                      Note: This remark will be posted as a public comment visible to the requester.
                    </div>
                  </div>
                </div>
              )}

              {/* CANCELLED: Confirmation Step for Terminal Cancellation (Fix 1) */}
              {isCancelling && (
                <div>
                  <div
                    className="alert alert-warning py-2 small mb-3"
                    role="alert"
                    data-testid="cancel-terminal-warning"
                  >
                    ⚠️ <strong>Warning:</strong> Cancellation is a terminal status. Once cancelled, no further transitions or action logging will be permitted on this ticket.
                  </div>
                  <p className="text-muted mb-3">
                    Are you sure you want to cancel ticket {ticketNumber ? <strong>{ticketNumber}</strong> : "this ticket"}?
                  </p>
                  <div className="mb-3">
                    <label
                      htmlFor="cancel-notes-field"
                      className="form-label small fw-semibold text-secondary mb-1"
                    >
                      Cancellation Reason / Remarks (Optional — visible to requester)
                    </label>
                    <textarea
                      id="cancel-notes-field"
                      className="form-control"
                      rows={3}
                      placeholder="Please specify why this ticket is being cancelled..."
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      disabled={isSubmitting}
                      data-testid="cancel-notes-input"
                      aria-label="Cancellation Reason"
                    />
                    <div className="form-text small text-muted">
                      Note: This remark will be posted as a public comment visible to the requester.
                    </div>
                  </div>
                </div>
              )}

              {!isResolving && !isClosing && !isCancelling && (
                <p className="text-muted mb-0">
                  Are you sure you want to update the ticket status to{" "}
                  <strong>{targetStatus}</strong>?
                </p>
              )}
            </div>

            <div className="modal-footer border-top py-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3"
                onClick={onClose}
                disabled={isSubmitting}
                data-testid={
                  isResolving
                    ? "cancel-resolve-btn"
                    : isClosing
                    ? "cancel-close-btn"
                    : isCancelling
                    ? "cancel-cancellation-btn"
                    : "cancel-transition-btn"
                }
              >
                Cancel
              </button>
              <button
                type="submit"
                className={
                  isCancelling
                    ? "btn btn-danger btn-sm text-white px-3 fw-semibold"
                    : "btn btn-sm text-white px-3 fw-semibold"
                }
                style={isCancelling ? undefined : { backgroundColor: "#006B3C" }}
                disabled={!canSubmit || isSubmitting}
                data-testid={
                  isResolving
                    ? "confirm-resolve-btn"
                    : isClosing
                    ? "confirm-close-btn"
                    : isCancelling
                    ? "confirm-cancel-btn"
                    : "confirm-transition-btn"
                }
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Updating...
                  </>
                ) : isResolving ? (
                  "Confirm & Resolve Ticket"
                ) : isClosing ? (
                  "Confirm & Close Ticket"
                ) : isCancelling ? (
                  "Confirm & Cancel Ticket"
                ) : (
                  "Confirm Transition"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatusTransitionModal;
