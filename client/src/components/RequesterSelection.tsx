import React, { useState, useEffect } from "react";
import { fetchRequesters, RequesterUser } from "../api";
import { useRequester } from "../context/RequesterContext";

export const RequesterSelection: React.FC = () => {
  const { selectRequester } = useRequester();
  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequesters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRequesters();
      setRequesters(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to load Development Requesters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequesters();
  }, []);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const found = requesters.find((r) => r.id === selectedId);
    if (found) {
      selectRequester(found);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 540 }}>
      <div
        className="card shadow-sm border-0"
        style={{ borderRadius: 12, backgroundColor: "#FFFFFF" }}
        data-testid="requester-selection-card"
      >
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <h2 className="h4 fw-bold text-dark mb-2" data-testid="selection-title">
              Select Development Requester
            </h2>
            <p className="text-muted small mb-0" style={{ lineHeight: 1.5 }}>
              Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3.
            </p>
          </div>

          {loading && (
            <div className="text-center py-4" data-testid="loading-state">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="small text-muted mt-2">Loading active requesters...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger mt-3" role="alert" data-testid="error-state">
              <div><strong>Failed to Load Requesters</strong></div>
              <div className="small mt-1">{error}</div>
              <button
                className="btn btn-outline-danger btn-sm mt-3"
                onClick={loadRequesters}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && requesters.length === 0 && (
            <div className="alert alert-warning py-3 text-center" data-testid="empty-state">
              <p className="mb-0 small">No active Development Requesters available in the database.</p>
            </div>
          )}

          {!loading && !error && requesters.length > 0 && (
            <form onSubmit={handleContinue}>
              <div className="mb-4">
                <label htmlFor="requesterSelect" className="form-label fw-semibold text-secondary small">
                  Active Development Requester <span className="text-danger">*</span>
                </label>
                <select
                  id="requesterSelect"
                  className="form-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  data-testid="requester-select-dropdown"
                  style={{ height: 44 }}
                >
                  <option value="" disabled>
                    -- Select a Development Requester --
                  </option>
                  {requesters.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.name} ({req.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn w-100 fw-semibold text-white py-2"
                style={{ backgroundColor: "#006B3C", borderRadius: 6 }}
                disabled={!selectedId}
                data-testid="continue-btn"
              >
                Continue
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
