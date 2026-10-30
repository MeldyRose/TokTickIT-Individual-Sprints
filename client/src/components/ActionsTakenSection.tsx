import React, { useState, useEffect, useCallback } from "react";
import { ActionTaken, fetchTicketActions } from "../api";
import { useAuth } from "../context/AuthContext";
import { ActionTakenModal } from "./ActionTakenModal";

interface ActionsTakenSectionProps {
  ticketId: string;
  ticketIsUnassigned?: boolean;
  ticketStatus?: string;
  onActionAddedOrUpdated?: () => void;
}

export const ActionsTakenSection: React.FC<ActionsTakenSectionProps> = ({
  ticketId,
  ticketIsUnassigned = false,
  ticketStatus,
  onActionAddedOrUpdated,
}) => {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [actionToEdit, setActionToEdit] = useState<ActionTaken | null>(null);

  const isTerminalStatus = ticketStatus === "CLOSED" || ticketStatus === "CANCELLED";
  const canManageActions =
    (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") && !isTerminalStatus;

  const loadActions = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTicketActions(ticketId);
      // Ensure chronological ordering by actionDateTime ascending
      const sorted = [...data].sort(
        (a, b) => new Date(a.actionDateTime).getTime() - new Date(b.actionDateTime).getTime()
      );
      setActions(sorted);
    } catch (err: any) {
      setError(err?.message || "Failed to load actions taken");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const handleOpenCreateModal = () => {
    setActionToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (action: ActionTaken) => {
    setActionToEdit(action);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (savedAction: ActionTaken) => {
    setActions((prev) => {
      const index = prev.findIndex((a) => a.id === savedAction.id);
      let updated: ActionTaken[];
      if (index >= 0) {
        updated = [...prev];
        updated[index] = savedAction;
      } else {
        updated = [...prev, savedAction];
      }
      return updated.sort((a, b) => new Date(a.actionDateTime).getTime() - new Date(b.actionDateTime).getTime());
    });
    if (onActionAddedOrUpdated) {
      onActionAddedOrUpdated();
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="card shadow-sm border-0 mb-4"
      style={{ borderRadius: "10px", overflow: "hidden" }}
      data-testid="actions-taken-section"
    >
      {/* Header Bar */}
      <div
        className="card-header bg-white py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2"
        style={{ borderBottom: "1px solid #D8E0DC" }}
      >
        <div className="d-flex align-items-center gap-2">
          <h5 className="mb-0 fw-bold text-dark" data-testid="actions-section-title">
            🛠️ Actions Taken
          </h5>
          <span
            className="badge rounded-pill fw-semibold"
            style={{ backgroundColor: "#EAF6EF", color: "#006B3C" }}
            data-testid="actions-count-badge"
          >
            {actions.length}
          </span>
        </div>

        {canManageActions && (
          <button
            type="button"
            className="btn btn-sm text-white fw-semibold d-flex align-items-center gap-1"
            style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
            onClick={handleOpenCreateModal}
            data-testid="log-action-btn"
          >
            <span>+</span> Log Action Taken
          </button>
        )}
      </div>

      <div className="card-body p-4" style={{ backgroundColor: "#FFFFFF" }}>
        {loading && (
          <div className="text-center py-4" data-testid="actions-loading-state">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading actions taken...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert" data-testid="actions-error-alert">
            {error}
          </div>
        )}

        {!loading && !error && actions.length === 0 && (
          <div className="text-center py-5 text-muted" data-testid="actions-empty-state">
            <div className="mb-2" style={{ fontSize: "2rem" }}>📋</div>
            <div className="fw-semibold">No Actions Taken Recorded</div>
            <div className="small">
              {isTerminalStatus
                ? "This ticket is closed or cancelled. No actions can be logged."
                : canManageActions
                ? "Document technical interventions or troubleshooting steps taken on this ticket."
                : "No actions have been logged by the IT support staff yet."}
            </div>
          </div>
        )}

        {!loading && !error && actions.length > 0 && (
          <>
            {/* Desktop Table View (>= 992px) */}
            <div className="d-none d-lg-block table-responsive" data-testid="actions-desktop-table-container">
              <table className="table align-middle border mb-0" data-testid="actions-table">
                <thead style={{ backgroundColor: "#F5F7F6", color: "#5A625E" }}>
                  <tr>
                    <th style={{ width: "16%" }}>Date / Time</th>
                    <th style={{ width: "16%" }}>Performer</th>
                    <th style={{ width: "38%" }}>Description & Result</th>
                    <th style={{ width: "18%" }}>Follow-up</th>
                    {canManageActions && <th style={{ width: "12%", textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {actions.map((act) => (
                    <tr key={act.id} data-testid={`action-row-${act.id}`}>
                      {/* Date / Time */}
                      <td className="align-top">
                        <span className="fw-semibold text-dark small d-block">
                          {formatDateTime(act.actionDateTime)}
                        </span>
                      </td>

                      {/* Performer */}
                      <td className="align-top">
                        <div className="fw-semibold text-dark small">{act.performedBy?.name || "Unknown"}</div>
                        <span
                          className="badge rounded-pill mt-1"
                          style={{
                            backgroundColor: act.performedBy?.role === "ADMINISTRATOR" ? "#7B1FA2" : "#006B3C",
                            color: "#FFFFFF",
                            fontSize: "0.75rem",
                          }}
                        >
                          {act.performedBy?.role === "ADMINISTRATOR" ? "Admin" : "IT Staff"}
                        </span>
                      </td>

                      {/* Description & Result */}
                      <td className="align-top">
                        <div className="text-dark small mb-2" style={{ whiteSpace: "pre-wrap" }}>
                          {act.description}
                        </div>
                        <div
                          className="rounded p-2 small mb-2"
                          style={{
                            backgroundColor: "#F5F7F6",
                            borderLeft: "3px solid #006B3C",
                          }}
                          data-testid={`action-result-${act.id}`}
                        >
                          <strong className="text-dark">Result: </strong>
                          <span className="text-secondary">{act.result}</span>
                        </div>
                        {act.attachmentNotes && (
                          <div className="text-muted small" data-testid={`action-attachment-${act.id}`}>
                            📎 <em>Attachment Notes: {act.attachmentNotes}</em>
                          </div>
                        )}
                      </td>

                      {/* Follow-up Status & Note */}
                      <td className="align-top">
                        {act.followUpRequired ? (
                          <div>
                            <span
                              className="badge px-2 py-1 mb-1 rounded-pill"
                              style={{ backgroundColor: "#ED6C02", color: "#FFFFFF" }}
                              data-testid={`action-followup-badge-${act.id}`}
                            >
                              ⚠️ Follow-up Required
                            </span>
                            {act.followUpNote && (
                              <div
                                className="rounded p-2 small mt-1"
                                style={{
                                  backgroundColor: "#FFF8E1",
                                  borderLeft: "3px solid #ED6C02",
                                }}
                                data-testid={`action-followup-note-${act.id}`}
                              >
                                <strong className="text-dark">Note: </strong>
                                <span className="text-secondary">{act.followUpNote}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            className="badge bg-secondary px-2 py-1 rounded-pill"
                            data-testid={`action-followup-badge-${act.id}`}
                          >
                            ✓ No Follow-up
                          </span>
                        )}
                      </td>

                      {/* Action edit control (Staff/Admin only on non-terminal tickets) */}
                      {canManageActions && (
                        <td className="align-top text-end">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleOpenEditModal(act)}
                            data-testid={`edit-action-btn-${act.id}`}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 992px) */}
            <div className="d-lg-none d-flex flex-column gap-3" data-testid="actions-mobile-cards-container">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="card border shadow-sm"
                  style={{ borderRadius: "8px", overflow: "hidden" }}
                  data-testid={`action-card-${act.id}`}
                >
                  {/* Card Header */}
                  <div
                    className="card-header bg-light d-flex justify-content-between align-items-center py-2 px-3"
                    style={{ borderBottom: "1px solid #D8E0DC" }}
                  >
                    <div>
                      <div className="fw-semibold text-dark small">{formatDateTime(act.actionDateTime)}</div>
                      <div className="d-flex align-items-center gap-1 mt-1">
                        <span className="small text-muted">{act.performedBy?.name}</span>
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: act.performedBy?.role === "ADMINISTRATOR" ? "#7B1FA2" : "#006B3C",
                            color: "#FFFFFF",
                            fontSize: "0.7rem",
                          }}
                        >
                          {act.performedBy?.role === "ADMINISTRATOR" ? "Admin" : "IT Staff"}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {act.followUpRequired ? (
                        <span
                          className="badge px-2 py-1 rounded-pill"
                          style={{ backgroundColor: "#ED6C02", color: "#FFFFFF", fontSize: "0.7rem" }}
                        >
                          ⚠️ Follow-up
                        </span>
                      ) : (
                        <span className="badge bg-secondary px-2 py-1 rounded-pill" style={{ fontSize: "0.7rem" }}>
                          ✓ None
                        </span>
                      )}

                      {canManageActions && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm px-2 py-0"
                          onClick={() => handleOpenEditModal(act)}
                          data-testid={`mobile-edit-action-btn-${act.id}`}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="card-body p-3">
                    <p className="text-dark small mb-2" style={{ whiteSpace: "pre-wrap" }}>
                      {act.description}
                    </p>

                    <div
                      className="rounded p-2 small mb-2"
                      style={{
                        backgroundColor: "#F5F7F6",
                        borderLeft: "3px solid #006B3C",
                      }}
                    >
                      <strong className="text-dark">Result: </strong>
                      <span className="text-secondary">{act.result}</span>
                    </div>

                    {act.followUpRequired && act.followUpNote && (
                      <div
                        className="rounded p-2 small mb-2"
                        style={{
                          backgroundColor: "#FFF8E1",
                          borderLeft: "3px solid #ED6C02",
                        }}
                      >
                        <strong className="text-dark">Follow-up Note: </strong>
                        <span className="text-secondary">{act.followUpNote}</span>
                      </div>
                    )}

                    {act.attachmentNotes && (
                      <div className="text-muted small mt-1">
                        📎 <em>Attachment Notes: {act.attachmentNotes}</em>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <ActionTakenModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          ticketId={ticketId}
          actionToEdit={actionToEdit}
          ticketIsUnassigned={ticketIsUnassigned}
        />
      )}
    </div>
  );
};
