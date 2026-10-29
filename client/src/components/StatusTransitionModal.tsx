import React, { useState, useEffect } from "react";
import { TicketStatus } from "../api";

interface StatusTransitionModalProps {
  targetStatus: TicketStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resolutionSummary?: string, comment?: string) => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  targetStatus,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  errorMessage = null,
}) => {
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [closureComment, setClosureComment] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setResolutionSummary("");
      setClosureComment("");
      setTouched(false);
    }
  }, [isOpen, targetStatus]);

  if (!isOpen || !targetStatus) return null;

  const isResolving = targetStatus === "RESOLVED";
  const isClosing = targetStatus === "CLOSED";

  const isResolutionValid = resolutionSummary.trim().length >= 10 && resolutionSummary.trim().length <= 2000;
  const canSubmit = isResolving ? isResolutionValid : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || isSubmitting) return;

    if (isResolving) {
      onConfirm(resolutionSummary.trim(), undefined);
    } else if (isClosing) {
      onConfirm(undefined, closureComment.trim() || undefined);
    } else {
      onConfirm();
    }
  };

  const modalTestId = isResolving
    ? "resolve-modal"
    : isClosing
    ? "close-ticket-modal"
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
                  : `Transition to ${targetStatus}`}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
                disabled={isSubmitting}
                data-testid={isResolving ? "cancel-resolve-btn" : "modal-close-x-btn"}
              />
            </div>

            <div className="modal-body py-4">
              {errorMessage && (
                <div
                  className="alert alert-danger py-2 small mb-3"
                  role="alert"
                  data-testid="resolution-gate-error"
                >
                  {errorMessage}
                </div>
              )}

              {isResolving && (
                <div>
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

              {isClosing && (
                <div>
                  <p className="text-muted mb-3">
                    Are you sure you want to formally close this ticket? This will mark the ticket as closed and finalize the record.
                  </p>
                  <div className="mb-3">
                    <label
                      htmlFor="close-notes-field"
                      className="form-label small fw-semibold text-secondary mb-1"
                    >
                      Closure Remarks (Optional)
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
                  </div>
                </div>
              )}

              {!isResolving && !isClosing && (
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
                    : "cancel-transition-btn"
                }
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm text-white px-3 fw-semibold"
                style={{ backgroundColor: "#006B3C" }}
                disabled={!canSubmit || isSubmitting}
                data-testid={
                  isResolving
                    ? "confirm-resolve-btn"
                    : isClosing
                    ? "confirm-close-btn"
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
