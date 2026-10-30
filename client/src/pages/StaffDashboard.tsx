import React, { useState, useEffect, useCallback } from "react";
import {
  fetchStaffDashboard,
  StaffDashboardResponse,
  StaffDashboardRecentTicket,
  Priority,
  TicketStatus,
} from "../api";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import { useAuth } from "../context/AuthContext";

export interface QueueFilterParams {
  ownership?: string;
  status?: string;
  priority?: string;
  search?: string;
  resolvedRange?: string;
  categoryId?: string;
}

export interface StaffDashboardProps {
  onNavigateToQueue?: (filters?: QueueFilterParams) => void;
  onSelectTicket?: (ticketId: string) => void;
  onCreateTicket?: () => void;
}

interface MetricCardConfig {
  id: string;
  testId: string;
  label: string;
  value: string | number;
  subtitle: string;
  accentColor: string;
  filters: QueueFilterParams;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onNavigateToQueue,
  onSelectTicket,
  onCreateTicket,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"recent" | "urgent">("recent");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchStaffDashboard();
      setData(response);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard metrics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCardClick = (filters: QueueFilterParams) => {
    if (onNavigateToQueue) {
      onNavigateToQueue(filters);
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

  // Calculate In Progress count from breakdown or status array if present
  const inProgressCount =
    data?.breakdown?.byStatus?.find(
      (s) => s.status?.toUpperCase() === "IN_PROGRESS"
    )?.count ??
    data?.ticketsByStatus?.find(
      (s) => s.status?.toUpperCase() === "IN_PROGRESS"
    )?.count ??
    0;

  const metricCards: MetricCardConfig[] = [
    {
      id: "unassigned",
      testId: "metric-card-unassigned",
      label: "Unassigned",
      value: data?.metrics.unassigned ?? 0,
      subtitle: "Awaiting assignment",
      accentColor: "#ED6C02", // Amber
      filters: { ownership: "unassigned" },
    },
    {
      id: "my-assigned",
      testId: "metric-card-my-assigned",
      label: "My Assigned",
      value: data?.metrics.ownedByMe ?? data?.metrics.myAssigned ?? 0,
      subtitle: "Assigned to your queue",
      accentColor: "#006B3C", // Zen Green
      filters: { ownership: "me" },
    },
    {
      id: "in-progress",
      testId: "metric-card-in-progress",
      label: "In Progress",
      value: inProgressCount,
      subtitle: "Actively being worked",
      accentColor: "#0288D1", // Soft Blue
      filters: { status: "IN_PROGRESS" },
    },
    {
      id: "waiting-for-requester",
      testId: "metric-card-waiting-for-requester",
      label: "Waiting for Requester",
      value: data?.metrics.waitingForRequester ?? 0,
      subtitle: "Awaiting user feedback",
      accentColor: "#7B1FA2", // Purple
      filters: { status: "WAITING_FOR_REQUESTER" },
    },
    {
      id: "urgent-or-high",
      testId: "metric-card-urgent-or-high",
      label: "High / Urgent",
      value: data?.metrics.urgentOrHigh ?? 0,
      subtitle: "Requires immediate triage",
      accentColor: "#D32F2F", // Crimson Red
      filters: { priority: "URGENT,HIGH", status: "open" },
    },
    {
      id: "total-open",
      testId: "metric-card-total-open",
      label: "Total Open",
      value: data?.metrics.totalOpen ?? 0,
      subtitle: "Active queue backlog",
      accentColor: "#0288D1", // Blue
      filters: { status: "open" },
    },
    {
      id: "resolved-today",
      testId: "metric-card-resolved-today",
      label: "Resolved Today",
      value: data?.metrics.resolvedToday ?? 0,
      subtitle: "Remediated since midnight",
      accentColor: "#2E7D32", // Forest Green
      filters: { status: "RESOLVED", resolvedRange: "today" },
    },
    {
      id: "avg-resolution-time",
      testId: "metric-card-avg-resolution-time",
      label: "Avg Resolution Time",
      value: data?.metrics.avgResolutionFormatted || "0m",
      subtitle: "Last 30-day average",
      accentColor: "#37474F", // Slate Gray
      filters: { status: "RESOLVED" },
    },
  ];

  const recentList: StaffDashboardRecentTicket[] =
    activeTab === "urgent"
      ? data?.recentUrgentTickets || []
      : data?.recentTickets || [];

  return (
    <div
      className="container-fluid py-4 px-3 px-md-4"
      style={{ maxWidth: 1400 }}
      data-testid="staff-dashboard"
    >
      {/* Overview & Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1
            className="h3 fw-bold mb-1"
            style={{ color: "#1A1D1C" }}
            data-testid="dashboard-title"
          >
            Operations Dashboard
          </h1>
          <p className="small mb-0" style={{ color: "#5A625E" }}>
            Real-time queue health, engineer workload, and team resolution velocity.
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
            onClick={() => onNavigateToQueue?.()}
            data-testid="dashboard-view-all-queue-btn"
          >
            View All Queue →
          </button>
        </div>
      </div>

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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <div key={idx} className="col-12 col-sm-6 col-lg-3">
                <div
                  className="card border-0 shadow-sm p-3 placeholder-glow"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 8,
                    minHeight: 120,
                  }}
                >
                  <span className="placeholder col-6 mb-2"></span>
                  <span className="placeholder col-4 mb-2" style={{ height: 32 }}></span>
                  <span className="placeholder col-8"></span>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div
                className="card border-0 shadow-sm p-4 placeholder-glow"
                style={{ backgroundColor: "#FFFFFF", borderRadius: 8, minHeight: 300 }}
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
                style={{ backgroundColor: "#FFFFFF", borderRadius: 8, minHeight: 300 }}
              >
                <span className="placeholder col-6 mb-3"></span>
                <span className="placeholder col-10 mb-2"></span>
                <span className="placeholder col-8 mb-2"></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Main Content */}
      {data && (
        <>
          {/* KPI Metric Cards Grid */}
          <div className="row g-3 mb-4" data-testid="metric-cards-grid">
            {metricCards.map((card) => (
              <div key={card.id} className="col-12 col-sm-6 col-lg-3">
                <div
                  role="button"
                  tabIndex={0}
                  className="card h-100 shadow-sm transition-elevation"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D8E0DC",
                    borderLeft: `5px solid ${card.accentColor}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    outline: "none",
                    padding: "16px 20px",
                  }}
                  onClick={() => handleCardClick(card.filters)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(card.filters);
                    }
                  }}
                  data-testid={card.testId}
                  aria-label={`${card.label}: ${card.value}. Click to view filtered queue.`}
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

          {/* Operational Widgets Row */}
          <div className="row g-4 mb-4">
            {/* Recent & Urgent Tickets Panel */}
            <div className="col-12 col-lg-8">
              <div
                className="card border-0 shadow-sm h-100"
                style={{ backgroundColor: "#FFFFFF", borderRadius: 8 }}
                data-testid="recent-tickets-panel"
              >
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold" style={{ color: "#1A1D1C", fontSize: "1.1rem" }}>
                      Operational Tickets
                    </span>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          activeTab === "recent"
                            ? "btn-success text-white fw-bold"
                            : "btn-outline-secondary"
                        }`}
                        style={
                          activeTab === "recent"
                            ? { backgroundColor: "#006B3C", borderColor: "#006B3C" }
                            : {}
                        }
                        onClick={() => setActiveTab("recent")}
                        data-testid="tab-recent-tickets"
                      >
                        Recent Activity ({data.recentTickets?.length || 0})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          activeTab === "urgent"
                            ? "btn-danger text-white fw-bold"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => setActiveTab("urgent")}
                        data-testid="tab-urgent-tickets"
                      >
                        Urgent / Critical ({data.recentUrgentTickets?.length || 0})
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                    style={{ color: "#006B3C" }}
                    onClick={() => onNavigateToQueue?.()}
                    data-testid="view-full-queue-link"
                  >
                    Full Queue →
                  </button>
                </div>

                <div className="card-body p-0">
                  {recentList.length === 0 ? (
                    <div
                      className="text-center py-5 px-3 text-muted"
                      data-testid="dashboard-empty-state"
                    >
                      <div className="display-6 mb-2">📋</div>
                      <p className="mb-0 fw-medium">No tickets found in this view.</p>
                      <small className="text-muted">
                        All issues are triaged or no tickets have been updated yet.
                      </small>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table
                        className="table table-hover align-middle mb-0"
                        data-testid="recent-tickets-table"
                      >
                        <thead
                          className="table-light text-muted small text-uppercase"
                          style={{ fontSize: "0.75rem", backgroundColor: "#F5F7F6" }}
                        >
                          <tr>
                            <th scope="col" className="ps-4">Ticket No.</th>
                            <th scope="col">Summary</th>
                            <th scope="col">Requester</th>
                            <th scope="col">Priority</th>
                            <th scope="col">Status</th>
                            <th scope="col">Owner</th>
                            <th scope="col">Updated</th>
                            <th scope="col" className="text-end pe-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentList.map((t) => (
                            <tr
                              key={t.id}
                              style={{ cursor: "pointer" }}
                              onClick={() => onSelectTicket?.(t.id)}
                              data-testid={`recent-ticket-row-${t.id}`}
                            >
                              <td className="ps-4 fw-bold text-success" data-testid="ticket-number">
                                {t.ticketNumber}
                              </td>
                              <td
                                className="fw-medium text-dark text-truncate"
                                style={{ maxWidth: 220 }}
                                title={t.summary}
                              >
                                {t.summary}
                              </td>
                              <td className="small text-secondary">{t.requesterName}</td>
                              <td>
                                <PriorityBadge priority={t.itPriority as Priority} />
                              </td>
                              <td>
                                <StatusBadge status={t.currentStatus as TicketStatus} />
                              </td>
                              <td className="small">
                                {t.ownerName ? (
                                  <span className="fw-medium text-dark">{t.ownerName}</span>
                                ) : (
                                  <span className="fst-italic text-muted">Unassigned</span>
                                )}
                              </td>
                              <td className="small text-muted">{formatDate(t.updatedAt)}</td>
                              <td className="text-end pe-4">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success py-0 px-2 fw-semibold"
                                  style={{ fontSize: "0.8rem" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectTicket?.(t.id);
                                  }}
                                  data-testid={`view-detail-btn-${t.id}`}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Queue Distribution Panel */}
            <div className="col-12 col-lg-4 d-flex flex-column gap-4">
              {/* Quick Actions Card */}
              <div
                className="card border-0 shadow-sm"
                style={{ backgroundColor: "#FFFFFF", borderRadius: 8 }}
                data-testid="quick-actions-panel"
              >
                <div className="card-header bg-white border-bottom py-3 px-4">
                  <h2 className="h6 fw-bold mb-0" style={{ color: "#1A1D1C" }}>
                    ⚡ Quick Actions
                  </h2>
                </div>
                <div className="card-body p-4 d-flex flex-column gap-2">
                  <button
                    type="button"
                    className="btn text-white w-100 text-start d-flex align-items-center justify-content-between py-2.5 px-3 fw-semibold shadow-sm"
                    style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                    onClick={() => onCreateTicket?.()}
                    data-testid="quick-action-create-ticket"
                  >
                    <span>+ Create Ticket</span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-success w-100 text-start d-flex align-items-center justify-content-between py-2.5 px-3 fw-semibold"
                    onClick={() => onNavigateToQueue?.({ ownership: "me" })}
                    data-testid="quick-action-my-queue"
                  >
                    <span>📋 View My Assigned Queue</span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 text-start d-flex align-items-center justify-content-between py-2.5 px-3 fw-semibold"
                    onClick={() => onNavigateToQueue?.({ search: "" })}
                    data-testid="quick-action-search-tickets"
                  >
                    <span>🔍 Search All Tickets</span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger w-100 text-start d-flex align-items-center justify-content-between py-2.5 px-3 fw-semibold"
                    onClick={() =>
                      onNavigateToQueue?.({ priority: "URGENT", status: "open" })
                    }
                    data-testid="quick-action-urgent-tickets"
                  >
                    <span>🚨 Triage Urgent Issues</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Status Breakdown Mini Widget */}
              {data.breakdown?.byStatus && data.breakdown.byStatus.length > 0 && (
                <div
                  className="card border-0 shadow-sm"
                  style={{ backgroundColor: "#FFFFFF", borderRadius: 8 }}
                  data-testid="queue-breakdown-widget"
                >
                  <div className="card-header bg-white border-bottom py-3 px-4">
                    <h2 className="h6 fw-bold mb-0" style={{ color: "#1A1D1C" }}>
                      Queue Status Distribution
                    </h2>
                  </div>
                  <div className="card-body p-4">
                    <div className="d-flex flex-column gap-3">
                      {data.breakdown.byStatus.map((item) => (
                        <div key={item.status} className="small">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="fw-medium text-dark">{item.status}</span>
                            <span className="text-muted">
                              {item.count} ({item.percentage}%)
                            </span>
                          </div>
                          <div
                            className="progress"
                            style={{ height: 6, backgroundColor: "#EAF6EF" }}
                          >
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${Math.min(100, item.percentage)}%`,
                                backgroundColor:
                                  item.status === "RESOLVED"
                                    ? "#2E7D32"
                                    : item.status === "WAITING_FOR_REQUESTER"
                                    ? "#7B1FA2"
                                    : item.status === "IN_PROGRESS"
                                    ? "#0288D1"
                                    : "#006B3C",
                              }}
                              aria-valuenow={item.percentage}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Administrator Overview Widget */}
              {user?.role === "ADMINISTRATOR" && data.adminOverview && (
                <div
                  className="card border-0 shadow-sm"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 8,
                    borderLeft: "4px solid #4A148C",
                  }}
                  data-testid="admin-overview-widget"
                >
                  <div className="card-header bg-white border-bottom py-3 px-4">
                    <h2 className="h6 fw-bold mb-0 text-dark">
                      👑 System Admin Overview
                    </h2>
                  </div>
                  <div className="card-body p-3">
                    <div className="row text-center g-2">
                      <div className="col-4">
                        <div className="small text-muted">Total Users</div>
                        <div
                          className="h5 fw-bold mb-0 text-dark"
                          data-testid="admin-total-users"
                        >
                          {data.adminOverview.totalUsers}
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="small text-muted">Active Staff</div>
                        <div
                          className="h5 fw-bold mb-0 text-success"
                          data-testid="admin-active-staff"
                        >
                          {data.adminOverview.activeStaff}
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="small text-muted">Requesters</div>
                        <div
                          className="h5 fw-bold mb-0 text-primary"
                          data-testid="admin-active-requesters"
                        >
                          {data.adminOverview.activeRequesters}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
