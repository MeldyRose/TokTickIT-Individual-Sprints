import React from "react";
import { TicketStatus, Priority } from "../api";

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  switch (status) {
    case "NEW":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#E7F1FF", color: "#0D6EFD", borderRadius: 12 }}
          data-testid="status-badge-new"
        >
          <span>•</span> New
        </span>
      );
    case "OPEN":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#FFF8E1", color: "#E65100", borderRadius: 12 }}
          data-testid="status-badge-open"
        >
          <span>•</span> Open
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#E8F5E9", color: "#1B5E20", borderRadius: 12 }}
          data-testid="status-badge-in-progress"
        >
          <span>⏱</span> In Progress
        </span>
      );
    case "WAITING_FOR_REQUESTER":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#F3E5F5", color: "#4A148C", borderRadius: 12 }}
          data-testid="status-badge-waiting-for-requester"
        >
          <span>⏳</span> Waiting for Requester
        </span>
      );
    case "RESOLVED":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#EAF6EF", color: "#006B3C", borderRadius: 12 }}
          data-testid="status-badge-resolved"
        >
          <span>✓</span> Resolved
        </span>
      );
    case "CLOSED":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#ECEFF1", color: "#37474F", borderRadius: 12 }}
          data-testid="status-badge-closed"
        >
          <span>🔒</span> Closed
        </span>
      );
    case "REOPENED":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#FBE9E7", color: "#BF360C", borderRadius: 12 }}
          data-testid="status-badge-reopened"
        >
          <span>↺</span> Reopened
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#EEEEEE", color: "#616161", borderRadius: 12 }}
          data-testid="status-badge-cancelled"
        >
          <span>✕</span> Cancelled
        </span>
      );
    default:
      return <span className="badge bg-secondary">{status}</span>;
  }
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  switch (priority) {
    case "LOW":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#E9ECEF", color: "#6C757D", borderRadius: 12 }}
          data-testid="priority-badge-low"
        >
          <span>↓</span> Low
        </span>
      );
    case "MEDIUM":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#FFF3CD", color: "#856404", borderRadius: 12 }}
          data-testid="priority-badge-medium"
        >
          <span>=</span> Medium
        </span>
      );
    case "HIGH":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold"
          style={{ backgroundColor: "#FFE8CC", color: "#FD7E14", borderRadius: 12 }}
          data-testid="priority-badge-high"
        >
          <span>↑</span> High
        </span>
      );
    case "URGENT":
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold fw-bold"
          style={{ backgroundColor: "#F8D7DA", color: "#B7094C", borderRadius: 12 }}
          data-testid="priority-badge-urgent"
        >
          <span>!</span> Urgent
        </span>
      );
    default:
      return <span className="badge bg-secondary">{priority}</span>;
  }
};
