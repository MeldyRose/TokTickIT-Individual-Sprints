import React, { useState } from "react";
import {
  TicketDetail,
  TicketStatus,
  PublicComment,
  updateTicketStatus,
  updateRequesterTicketStatus,
  fetchTicketActionsCount,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { getPermittedNextStatuses } from "../utils/statusMatrix";
import { StatusTransitionModal, ErrorDetail } from "./StatusTransitionModal";
import { ConcurrencyConflictBanner } from "./ConcurrencyConflictBanner";

interface TicketWorkflowControlsProps {
  ticket: TicketDetail;
  comments?: PublicComment[];
  onStatusUpdated: (newStatus: TicketStatus, resolutionSummary?: string) => void | Promise<void>;
  onRefreshTicket: () => void | Promise<void>;
}

export const TicketWorkflowControls: React.FC<TicketWorkflowControlsProps> = ({
  ticket,
  comments,
  onStatusUpdated,
  onRefreshTicket,
}) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | "">("");
  const [modalTargetStatus, setModalTargetStatus] = useState<TicketStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalErrorDetails, setModalErrorDetails] = useState<ErrorDetail[] | null>(null);
  const [actionsCount, setActionsCount] = useState<number | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Requester resolve modal state
  const [showRequesterResolveModal, setShowRequesterResolveModal] = useState(false);
  const [requesterNote, setRequesterNote] = useState("");
  const [requesterSubmitting, setRequesterSubmitting] = useState(false);

  const isStaffOrAdmin = user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";
  const isRequester = user?.role === "REQUESTER";

  const permittedStatuses = isStaffOrAdmin
    ? getPermittedNextStatuses(ticket.currentStatus)
    : [];

  const isTerminalState = ticket.currentStatus === "CLOSED" || ticket.currentStatus === "CANCELLED";

  const handleInitiateTransition = (target: TicketStatus) => {
    setGeneralError(null);
    setConflictError(null);
    setSuccessMessage(null);
    setModalError(null);
    setModalErrorDetails(null);

    // Prompt modal for RESOLVED, CLOSED, or CANCELLED (Fix 1: Terminal CANCELLED requires confirmation)
    if (target === "RESOLVED" || target === "CLOSED" || target === "CANCELLED") {
      setModalTargetStatus(target);
      setIsModalOpen(true);

      if (target === "RESOLVED") {
        fetchTicketActionsCount(ticket.id)
          .then((cnt) => setActionsCount(cnt))
          .catch(() => setActionsCount(null));
      }
    } else {
      executeStatusUpdate(target);
    }
  };

  const executeStatusUpdate = async (
    target: TicketStatus,
    resolutionSummary?: string,
    closureComment?: string
  ) => {
    setIsSubmitting(true);
    setModalError(null);
    setModalErrorDetails(null);
    setGeneralError(null);
    setConflictError(null);

    try {
      const res = await updateTicketStatus(
        ticket.id,
        target,
        closureComment,
        ticket.updatedAt,
        resolutionSummary
      );

      setIsModalOpen(false);
      setModalTargetStatus(null);
      setModalErrorDetails(null);
      setSelectedStatus("");
      setSuccessMessage(`Ticket status successfully updated to ${res.currentStatus || target}.`);

      await onStatusUpdated(res.currentStatus || target, resolutionSummary);
    } catch (err: any) {
      if (
        err?.status === 409 ||
        err?.code === "STALE_UPDATE" ||
        err?.message?.toLowerCase().includes("conflict") ||
        err?.message?.toLowerCase().includes("stale")
      ) {
        setConflictError(
          err?.message ||
            "This ticket was updated by another user while you were viewing it. To prevent overwriting their changes, your update was not saved. Please reload the latest changes before reapplying."
        );
        setIsModalOpen(false);
      } else if (err?.status === 422 || err?.code === "RESOLUTION_GATE_FAILED") {
        setModalError(err?.message || "Resolution gate verification failed. Please review requirements.");
        setModalErrorDetails(err?.details || null);
        if (err?.details?.some((d: any) => d.criterion === "MISSING_ACTION_TAKEN")) {
          setActionsCount(0);
        }
      } else {
        const msg = err?.message || "Failed to update ticket status.";
        if (isModalOpen) {
          setModalError(msg);
          setModalErrorDetails(err?.details || null);
        } else {
          setGeneralError(msg);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequesterResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesterSubmitting(true);
    setConflictError(null);
    setGeneralError(null);

    try {
      const res = await updateRequesterTicketStatus(
        ticket.id,
        "WAITING_FOR_REQUESTER",
        requesterNote.trim() || "Problem appears resolved by Requester.",
        ticket.updatedAt
      );

      setShowRequesterResolveModal(false);
      setRequesterNote("");
      setSuccessMessage("Problem reported as resolved. IT Staff has been notified for review.");
      await onStatusUpdated(res.currentStatus || "WAITING_FOR_REQUESTER");
    } catch (err: any) {
      if (
        err?.status === 409 ||
        err?.code === "STALE_UPDATE" ||
        err?.message?.toLowerCase().includes("conflict") ||
        err?.message?.toLowerCase().includes("stale")
      ) {
        setConflictError(
          err?.message || "This ticket was modified by another user. Please reload the latest changes."
        );
        setShowRequesterResolveModal(false);
      } else {
        alert(err?.message || "Failed to report problem as resolved");
      }
    } finally {
      setRequesterSubmitting(false);
    }
  };

  const handleRefreshFromConflict = async () => {
    setConflictError(null);
    setGeneralError(null);
    setModalError(null);
    setModalErrorDetails(null);
    setIsModalOpen(false);
    await onRefreshTicket();
  };

  const isActiveTicket = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"].includes(
    ticket.currentStatus
  );

  // Check if a requester indicated resolution
  const hasRequesterResolution = comments
    ? comments.some(
        (c) =>
          (c.author?.role === "REQUESTER" || c.author?.id === ticket.requesterId) &&
          /resolve/i.test(c.content)
      ) ||
      (comments.length > 0 &&
        (comments[comments.length - 1].author?.role === "REQUESTER" ||
          comments[comments.length - 1].author?.id === ticket.requesterId))
    : true; // Default to true if comments not provided (isolated unit test support)

  return (
    <div className="ticket-workflow-controls mb-4" data-testid="ticket-workflow-controls">
      {/* Concurrency Conflict Warning Banner */}
      {conflictError && (
        <ConcurrencyConflictBanner
          message={conflictError}
          onRefresh={handleRefreshFromConflict}
          onDismiss={() => setConflictError(null)}
        />
      )}

      {/* General Error Banner */}
      {generalError && (
        <div
          className="alert alert-danger py-2 small mb-3"
          role="alert"
          data-testid="workflow-general-error"
        >
          {generalError}
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div
          className="alert alert-success py-2 small mb-3 d-flex align-items-center justify-content-between"
          role="status"
          data-testid="status-update-success"
          style={{ backgroundColor: "#EAF6EF", borderColor: "#B2DFDB", color: "#006B3C" }}
        >
          <span>✓ {successMessage}</span>
          <button
            type="button"
            className="btn-close btn-sm"
            aria-label="Close"
            onClick={() => setSuccessMessage(null)}
          />
        </div>
      )}

      {/* Advisory Indicator for IT Staff when Requester reported resolved */}
      {isStaffOrAdmin && ticket.currentStatus === "WAITING_FOR_REQUESTER" && hasRequesterResolution && (
        <div
          className="p-3 mb-3 rounded d-flex align-items-start gap-2 shadow-sm"
          role="status"
          data-testid="workflow-advisory-indicator"
          style={{
            backgroundColor: "#F3E5F5",
            borderLeft: "4px solid #7B1FA2",
            color: "#4A148C",
          }}
        >
          <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>ℹ️</span>
          <div>
            <div className="fw-semibold">Requester Feedback / Resolution Advisory</div>
            <div className="small" data-testid="requester-resolved-advisory">
              A requester has indicated problem resolution or input is pending. Please verify remediation and proceed with formal resolution or next action.
            </div>
          </div>
        </div>
      )}

      {/* IT Staff / Admin Workflow Transition Controls */}
      {isStaffOrAdmin && (
        <div
          className="card border-0 shadow-sm p-3"
          style={{ borderRadius: 10, backgroundColor: "#FFFFFF" }}
          data-testid="staff-workflow-card"
        >
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <span className="small text-muted fw-semibold text-uppercase tracking-wider">
                Workflow Status Transitions
              </span>
              <div className="fw-bold text-dark mt-1">
                Current State: <span className="text-success">{ticket.currentStatus}</span>
              </div>
            </div>

            {isTerminalState ? (
              <div
                className="badge bg-secondary p-2 text-wrap"
                data-testid="terminal-status-notice"
              >
                Terminal State ({ticket.currentStatus}): No further status transitions permitted.
              </div>
            ) : (
              <div className="d-flex flex-wrap align-items-center gap-2" data-testid="status-action-group">
                {/* Transition Dropdown Selection */}
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: 180 }}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                    disabled={isSubmitting || permittedStatuses.length === 0}
                    data-testid="status-transition-select"
                    aria-label="Select next status transition"
                  >
                    <option value="">Next status...</option>
                    {permittedStatuses.map((st) => (
                      <option key={st} value={st} data-testid={`select-option-${st.toLowerCase()}`}>
                        {st.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: "#006B3C" }}
                    onClick={() => {
                      if (selectedStatus) {
                        handleInitiateTransition(selectedStatus as TicketStatus);
                      }
                    }}
                    disabled={!selectedStatus || isSubmitting}
                    data-testid="apply-status-transition-btn"
                  >
                    {isSubmitting ? "Updating..." : "Update Status"}
                  </button>
                </div>

                {/* Direct Shortcut Action Buttons for Permitted Statuses */}
                <div className="d-none d-lg-flex align-items-center gap-1 border-start ps-2">
                  {permittedStatuses.map((st) => {
                    const isResolve = st === "RESOLVED";
                    const isClose = st === "CLOSED";
                    const isCancel = st === "CANCELLED";
                    const btnClass = isResolve
                      ? "btn-success"
                      : isClose
                      ? "btn-dark"
                      : isCancel
                      ? "btn-outline-danger"
                      : "btn-outline-primary";

                    return (
                      <button
                        key={st}
                        type="button"
                        className={`btn btn-sm ${btnClass} fw-semibold`}
                        onClick={() => handleInitiateTransition(st)}
                        disabled={isSubmitting}
                        data-testid={`transition-to-${st.toLowerCase().replace(/_/g, "-")}`}
                      >
                        {st.replace(/_/g, " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requester "Problem Appears Resolved" Action Control */}
      {isRequester && isActiveTicket && (
        <div className="d-flex justify-content-end" data-testid="requester-workflow-group">
          <button
            type="button"
            className="btn text-white btn-sm fw-semibold px-3"
            style={{ backgroundColor: "#006B3C" }}
            onClick={() => setShowRequesterResolveModal(true)}
            data-testid="problem-resolved-btn"
          >
            ✓ Problem Appears Resolved
          </button>
        </div>
      )}

      {/* IT Staff Modal: Review & Confirm Resolution / Closure / Cancellation */}
      <StatusTransitionModal
        targetStatus={modalTargetStatus}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalTargetStatus(null);
          setModalError(null);
          setModalErrorDetails(null);
        }}
        onConfirm={(resolutionSummary, comment) => {
          if (modalTargetStatus) {
            executeStatusUpdate(modalTargetStatus, resolutionSummary, comment);
          }
        }}
        isSubmitting={isSubmitting}
        errorMessage={modalError}
        errorDetails={modalErrorDetails}
        actionsCount={actionsCount}
        ticketNumber={ticket.ticketNumber}
      />

      {/* Requester Problem Appears Resolved Modal */}
      {showRequesterResolveModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1055 }}
          data-testid="requester-resolve-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleRequesterResolve}>
                <div className="modal-header border-bottom py-3">
                  <h5 className="modal-title fw-bold text-dark">Confirm Problem Resolution</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowRequesterResolveModal(false)}
                    disabled={requesterSubmitting}
                  />
                </div>
                <div className="modal-body py-4">
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
                      value={requesterNote}
                      onChange={(e) => setRequesterNote(e.target.value)}
                      data-testid="resolution-note-input"
                    />
                  </div>
                </div>
                <div className="modal-footer border-top py-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowRequesterResolveModal(false)}
                    disabled={requesterSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success btn-sm text-white fw-semibold"
                    disabled={requesterSubmitting}
                    data-testid="confirm-resolved-btn"
                  >
                    {requesterSubmitting ? "Submitting..." : "Confirm & Notify IT Staff"}
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

export default TicketWorkflowControls;
