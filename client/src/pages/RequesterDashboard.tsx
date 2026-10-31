import React, { useState, useEffect, useCallback } from "react";
import {
  fetchRequesterDashboard,
  fetchMyTickets,
  RequesterDashboardResponse,
  RequesterDashboardRecentTicket,
} from "../api";
import { StatusBadge } from "../components/Badge";
import { useAuth } from "../context/AuthContext";

export interface RequesterDashboardProps {
  onNavigateToTickets?: (status?: string, resolvedRange?: string) => void;
  onSelectTicket?: (ticketId: string) => void;
  onCreateTicket?: () => void;
}

interface RequesterMetricCardConfig {
  id: string;
  testId: string;
  label: string;
  value: string | number;
  subtitle: string;
  accentColor: string;
  statusFilter?: string;
  resolvedRange?: string;
}

export const RequesterDashboard: React.FC<RequesterDashboardProps> = ({
  onNavigateToTickets,
  onSelectTicket,
  onCreateTicket,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status-specific counts for In Progress and Closed
  const [inProgressCount, setInProgressCount] = useState<number>(0);
  const [closedCount, setClosedCount] = useState<number>(0);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchRequesterDashboard();
      setData(response);

      // Fetch precise status counts for In Progress and Closed if not provided in response
      try {
        const [inProgressRes, closedRes] = await Promise.allSettled([
          fetchMyTickets({ limit: 1, status: "IN_PROGRESS" }),
          fetchMyTickets({ limit: 1, status: "CLOSED" }),
        ]);

        if (inProgressRes.status === "fulfilled") {
          setInProgressCount(inProgressRes.value.pagination.totalItems);
        } else if (response.metrics.inProgress !== undefined) {
          setInProgressCount(response.metrics.inProgress);
        }

        if (closedRes.status === "fulfilled") {
          setClosedCount(closedRes.value.pagination.totalItems);
        } else if (response.metrics.closed !== undefined) {
          setClosedCount(response.metrics.closed);
        }
      } catch {
        if (response.metrics.inProgress !== undefined) setInProgressCount(response.metrics.inProgress);
        if (response.metrics.closed !== undefined) setClosedCount(response.metrics.closed);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load requester dashboard metrics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCardClick = (statusFilter?: string, resolvedRange?: string) => {
    if (onNavigateToTickets) {
      onNavigateToTickets(statusFilter, resolvedRange);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const waitingCount =
    data?.metrics.waitingForMyInput ?? data?.metrics.waitingForRequester ?? 0;

  const resolvedRecentlyCount =
    data?.metrics.resolvedRecently ?? data?.metrics.recentlyResolved ?? 0;

  const metricCards: RequesterMetricCardConfig[] = [
    {
      id: "my-open-tickets",
      testId: "metric-card-open",
      label: "My Open Tickets",
      value: data?.metrics.totalOpen ?? data?.metrics.totalActive ?? 0,
      subtitle: "Active tickets being processed",
      accentColor: "#0288D1", // Soft Blue
      statusFilter: "open",
    },
    {
      id: "in-progress",
      testId: "metric-card-in-progress",
      label: "In Progress",
      value: data?.metrics.inProgress !== undefined ? data.metrics.inProgress : inProgressCount,
      subtitle: "Actively being worked on by IT",
      accentColor: "#ED6C02", // Amber
      statusFilter: "IN_PROGRESS",
    },
    {
      id: "waiting-input",
      testId: "metric-card-waiting-input",
      label: "Waiting for My Input",
      value: waitingCount,
      subtitle: "IT staff awaiting your response",
      accentColor: "#7B1FA2", // Purple
      statusFilter: "WAITING_FOR_REQUESTER",
    },
    {
      id: "resolved",
      testId: "metric-card-resolved",
      label: "Resolved Recently",
      value: resolvedRecentlyCount,
      subtitle: "Tickets resolved in the last 7 days",
      accentColor: "#2E7D32", // Forest Green
      statusFilter: "resolved-7d",
      resolvedRange: "7d",
    },
    {
      id: "closed",
      testId: "metric-card-closed",
      label: "Closed",
      value: data?.metrics.closed !== undefined ? data.metrics.closed : closedCount,
      subtitle: "Archived & completed tickets",
      accentColor: "#37474F", // Slate Gray
      statusFilter: "CLOSED",
    },
  ];

  const recentTickets: RequesterDashboardRecentTicket[] =
    data?.recentTickets || data?.recentActivity || [];

  const firstWaitingTicket = recentTickets.find((t) => t.actionRequired);

  return (
    <div
      className="container-fluid py-4 px-3 px-md-4"
      style={{ maxWidth: 1400 }}
      data-testid="requester-dashboard"
    >
      {/* Overview & Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1
            className="h3 fw-bold mb-1"
            style={{ color: "#1A1D1C" }}
            data-testid="requester-dashboard-title"
          >
            My IT Support Dashboard
          </h1>
          <p className="small mb-0" style={{ color: "#5A625E" }}>
            Track the progress of your IT support tickets and pending requests.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
            onClick={loadDashboard}
            disabled={isLoading}
            data-testid="dashboard-refresh-btn"
            aria-label="Refresh dashboard data"
          >
            <span
              className={isLoading ? "spinner-border spinner-border-sm" : ""}
              role={isLoading ? "status" : undefined}
            >
              {!isLoading && "↻"}
            </span>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-sm text-white shadow-sm fw-semibold"
            style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
            onClick={() => onCreateTicket?.()}
            data-testid="dashboard-create-ticket-btn"
          >
            + Create Ticket
          </button>
        </div>
      </div>

      {/* Action Required Alert Banner */}
      {waitingCount > 0 && (
        <div
          className="alert d-flex flex-wrap align-items-center justify-content-between shadow-sm mb-4"
          style={{
            backgroundColor: "#FFF8E1",
            border: "1px solid #FFE082",
            borderLeft: "5px solid #ED6C02",
            borderRadius: 8,
            color: "#5D4037",
          }}
          role="alert"
          data-testid="requester-action-required-banner"
        >
          <div className="d-flex align-items-center gap-2 my-1">
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <div>
              <strong>Action Required:</strong> IT Staff is waiting for your response on{" "}
              <strong>
                {waitingCount} ticket{waitingCount > 1 ? "s" : ""}
              </strong>
              . Please review ticket details to provide the requested information.
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 my-1 flex-wrap">
            {firstWaitingTicket && (
              <button
                type="button"
                className="btn btn-sm btn-outline-dark fw-semibold shadow-sm"
                onClick={() => onSelectTicket?.(firstWaitingTicket.id)}
                data-testid="banner-review-ticket-btn"
              >
                Review Ticket #{firstWaitingTicket.ticketNumber} →
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm text-white fw-semibold shadow-sm"
              style={{ backgroundColor: "#ED6C02", borderColor: "#ED6C02" }}
              onClick={() => handleCardClick("WAITING_FOR_REQUESTER")}
              data-testid="banner-view-waiting-tickets"
            >
              View Waiting Tickets →
            </button>
          </div>
        </div>
      )}

      {/* Error Retry Banner */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center justify-content-between shadow-sm mb-4"
          role="alert"
          data-testid="dashboard-error-banner"
        >
          <div>
            <strong>Error loading dashboard:</strong> {error}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger fw-semibold"
            onClick={loadDashboard}
            data-testid="dashboard-retry-btn"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !data && (
        <div data-testid="dashboard-skeleton">
          <div className="row g-3 mb-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="col-12 col-sm-6 col-lg">
                <div
                  className="card border-0 shadow-sm p-3 placeholder-glow"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 8,
                    minHeight: 110,
                  }}
                >
                  <span className="placeholder col-6 mb-2"></span>
                  <span className="placeholder col-4 mb-2" style={{ height: 28 }}></span>
                  <span className="placeholder col-8"></span>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div
                className="card border-0 shadow-sm p-4 placeholder-glow"
                style={{ backgroundColor: "#FFFFFF", borderRadius: 8, minHeight: 250 }}
              >
                <span className="placeholder col-4 mb-3"></span>
                <span className="placeholder col-12 mb-2"></span>
                <span className="placeholder col-12 mb-2"></span>
                <span className="placeholder col-12 mb-2"></span>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div
                className="card border-0 shadow-sm p-4 placeholder-glow"
                style={{ backgroundColor: "#FFFFFF", borderRadius: 8, minHeight: 250 }}
              >
                <span className="placeholder col-6 mb-3"></span>
                <span className="placeholder col-10 mb-2"></span>
                <span className="placeholder col-8 mb-2"></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <>
          {/* Metric Cards Grid */}
          <div className="row g-3 mb-4" data-testid="metric-cards-grid">
            {metricCards.map((card) => (
              <div key={card.id} className="col-12 col-sm-6 col-lg">
                <div
                  role="button"
                  tabIndex={0}
                  className="card h-100 shadow-sm transition-elevation dashboard-metric-card"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D8E0DC",
                    borderLeft: `5px solid ${card.accentColor}`,
                    borderRadius: 8,
                    cursor: "pointer",
                                        padding: "16px 20px",
                  }}
                  onClick={() => handleCardClick(card.statusFilter, card.resolvedRange)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(card.statusFilter, card.resolvedRange);
                    }
                  }}
                  data-testid={card.testId}
                  aria-label={`${card.label}: ${card.value}. Click to view filtered tickets.`}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span
                      className="small fw-semibold text-uppercase tracking-wider"
                      style={{ color: "#5A625E", fontSize: "0.8rem" }}
                    >
                      {card.label}
                    </span>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: `${card.accentColor}1A`,
                        color: card.accentColor,
                        fontSize: "0.75rem",
                      }}
                    >
                      Filter ↗
                    </span>
                  </div>
                  <div
                    className="h2 fw-bold mb-1"
                    style={{ color: "#1A1D1C" }}
                    data-testid={`${card.testId}-value`}
                  >
                    {card.value}
                  </div>
                  <div className="small text-muted">{card.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            {/* My Recent Tickets Widget */}
            <div className="col-12 col-lg-8">
              <div
                className="card shadow-sm border-0 h-100"
                style={{ backgroundColor: "#FFFFFF", borderRadius: 8 }}
                data-testid="my-recent-tickets-widget"
              >
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="h6 fw-bold mb-0" style={{ color: "#1A1D1C" }}>
                      My Recent Tickets
                    </h2>
                    <span className="small text-muted">Latest activity on your submitted requests</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none fw-semibold"
                    style={{ color: "#006B3C" }}
                    onClick={() => onNavigateToTickets?.()}
                    data-testid="recent-tickets-view-all"
                  >
                    View All My Tickets →
                  </button>
                </div>

                <div className="card-body p-0">
                  {recentTickets.length === 0 ? (
                    <div
                      className="p-5 text-center text-muted"
                      data-testid="dashboard-empty-state"
                    >
                      <div className="mb-2" style={{ fontSize: "2.5rem" }}>
                        📋
                      </div>
                      <h3 className="h6 fw-semibold text-dark mb-1">No tickets submitted yet</h3>
                      <p className="small mb-3 text-muted">
                        When you submit IT support tickets, track their live remediation here.
                      </p>
                      <button
                        type="button"
                        className="btn btn-sm text-white fw-semibold shadow-sm"
                        style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                        onClick={() => onCreateTicket?.()}
                      >
                        + Create Your First Ticket
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View (>= 768px) */}
                      <div className="table-responsive d-none d-md-block">
                        <table
                          className="table table-hover align-middle mb-0"
                          data-testid="requester-recent-tickets-table"
                        >
                          <thead className="table-light" style={{ fontSize: "0.8rem", color: "#5A625E" }}>
                            <tr>
                              <th scope="col" className="ps-4">Ticket No.</th>
                              <th scope="col">Summary</th>
                              <th scope="col">Status</th>
                              <th scope="col">Last Updated</th>
                              <th scope="col" className="text-end pe-4">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentTickets.map((ticket) => (
                              <tr
                                key={ticket.id}
                                style={{ cursor: "pointer" }}
                                onClick={() => onSelectTicket?.(ticket.id)}
                                data-testid={`recent-ticket-row-${ticket.id}`}
                              >
                                <td className="ps-4 fw-bold font-monospace text-primary">
                                  {ticket.ticketNumber}
                                </td>
                                <td style={{ maxWidth: 320 }}>
                                  <div className="text-truncate fw-medium" title={ticket.summary}>
                                    {ticket.summary}
                                  </div>
                                  {ticket.actionRequired && (
                                    <span
                                      className="badge bg-warning text-dark mt-1"
                                      style={{ fontSize: "0.7rem" }}
                                      data-testid="ticket-action-required-badge"
                                    >
                                      ⚠️ Action Required
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <StatusBadge status={ticket.currentStatus} />
                                </td>
                                <td className="small text-muted">{formatDate(ticket.updatedAt)}</td>
                                <td className="text-end pe-4">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success fw-semibold"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectTicket?.(ticket.id);
                                    }}
                                    data-testid={`view-ticket-${ticket.id}`}
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Stacked Card View (< 768px) to prevent horizontal scrolling (ui-spec 5.1) */}
                      <div className="d-md-none p-3 d-flex flex-column gap-2" data-testid="mobile-recent-tickets-cards">
                        {recentTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="card border shadow-sm p-3"
                            style={{ borderRadius: 8, cursor: "pointer", backgroundColor: "#FFFFFF" }}
                            onClick={() => onSelectTicket?.(ticket.id)}
                            data-testid={`mobile-recent-ticket-card-${ticket.id}`}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold font-monospace text-primary small">
                                {ticket.ticketNumber}
                              </span>
                              <StatusBadge status={ticket.currentStatus} />
                            </div>
                            <div className="fw-medium text-dark mb-1">{ticket.summary}</div>
                            {ticket.actionRequired && (
                              <div className="mb-2">
                                <span
                                  className="badge bg-warning text-dark"
                                  style={{ fontSize: "0.7rem" }}
                                  data-testid="ticket-action-required-badge"
                                >
                                  ⚠️ Action Required
                                </span>
                              </div>
                            )}
                            <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-1">
                              <span className="small text-muted">{formatDate(ticket.updatedAt)}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success fw-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectTicket?.(ticket.id);
                                }}
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Self-Service Widget */}
            <div className="col-12 col-lg-4">
              <div
                className="card shadow-sm border-0 h-100"
                style={{ backgroundColor: "#FFFFFF", borderRadius: 8 }}
                data-testid="quick-actions-widget"
              >
                <div className="card-header bg-white border-bottom py-3 px-4">
                  <h2 className="h6 fw-bold mb-0" style={{ color: "#1A1D1C" }}>
                    Quick Actions
                  </h2>
                  <span className="small text-muted">Self-service shortcuts</span>
                </div>
                <div className="card-body p-4 d-flex flex-column gap-3 justify-content-center">
                  <div className="p-3 rounded border" style={{ backgroundColor: "#F5F7F6" }}>
                    <h3 className="h6 fw-bold mb-1 text-dark">Need Technical Assistance?</h3>
                    <p className="small text-muted mb-3">
                      Submit a new support ticket to report hardware, software, or network issues.
                    </p>
                    <button
                      type="button"
                      className="btn text-white w-100 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                      onClick={() => onCreateTicket?.()}
                      data-testid="quick-action-create-ticket"
                    >
                      <span>+</span>
                      <span>Create New Ticket</span>
                    </button>
                  </div>

                  <div className="p-3 rounded border" style={{ backgroundColor: "#F5F7F6" }}>
                    <h3 className="h6 fw-bold mb-1 text-dark">Review Submitted Requests</h3>
                    <p className="small text-muted mb-3">
                      Search, filter, and inspect resolution progress across all your tickets.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline-dark w-100 fw-semibold shadow-sm"
                      onClick={() => onNavigateToTickets?.()}
                      data-testid="quick-action-view-my-tickets"
                    >
                      View All My Tickets
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
