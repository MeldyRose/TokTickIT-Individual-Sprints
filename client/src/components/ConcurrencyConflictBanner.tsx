import React from "react";

interface ConcurrencyConflictBannerProps {
  onRefresh: () => void | Promise<void>;
  onDismiss?: () => void;
  message?: string;
}

export const ConcurrencyConflictBanner: React.FC<ConcurrencyConflictBannerProps> = ({
  onRefresh,
  onDismiss,
  message,
}) => {
  return (
    <div
      className="alert alert-warning border border-warning shadow-sm mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
      role="alert"
      data-testid="concurrency-conflict-banner"
      style={{
        backgroundColor: "#FFF8E1",
        borderColor: "#FFE082",
        color: "#B78103",
        borderRadius: "8px",
      }}
    >
      <div className="d-flex align-items-center gap-2">
        <span style={{ fontSize: "1.25rem" }}>⚠️</span>
        <div>
          <div className="fw-bold text-dark">Update Conflict (409 Conflict)</div>
          <div className="small text-secondary">
            {message ||
              "This ticket was updated by another user while you were viewing it. To prevent overwriting their changes, your update was not saved. Please reload the latest changes."}
          </div>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-sm text-white fw-semibold px-3"
          style={{ backgroundColor: "#006B3C" }}
          onClick={onRefresh}
          data-testid="reload-ticket-btn"
        >
          🔄 Reload Latest Changes
        </button>
        {onDismiss && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onDismiss}
            data-testid="dismiss-conflict-btn"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default ConcurrencyConflictBanner;
