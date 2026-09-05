import React, { useState, useEffect } from "react";
import { fetchCategories, fetchRelatedSystems, createTicket, Category, RelatedSystem, Priority, Ticket } from "../api";
import { useRequester } from "../context/RequesterContext";

interface CreateTicketProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateTicket: React.FC<CreateTicketProps> = ({ onSuccess, onCancel }) => {
  const { activeRequester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<Priority>("MEDIUM");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ summary?: string; categoryId?: string; relatedSystemId?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchCategories(), fetchRelatedSystems()])
      .then(([cats, syss]) => {
        if (isMounted) {
          setCategories(cats);
          setRelatedSystems(syss);
          if (cats.length > 0) setCategoryId(cats[0].id);
          if (syss.length > 0) setRelatedSystemId(syss[0].id);
        }
      })
      .catch((err) => {
        if (isMounted) setApiError(err?.message || "Failed to load reference data");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const validate = (): boolean => {
    const errs: { summary?: string; categoryId?: string; relatedSystemId?: string } = {};

    if (!summary || summary.trim().length === 0) {
      errs.summary = "Summary is required";
    } else if (summary.trim().length > 255) {
      errs.summary = "Summary must be 255 characters or less";
    }

    if (!categoryId) {
      errs.categoryId = "Category is required";
    }

    if (!relatedSystemId) {
      errs.relatedSystemId = "Related System is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    if (!activeRequester) {
      setApiError("No active requester selected");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createTicket(
        {
          summary: summary.trim(),
          description: description.trim() || undefined,
          categoryId,
          relatedSystemId,
          requestedPriority,
        },
        activeRequester.id
      );
      setCreatedTicket(ticket);
    } catch (err: any) {
      setApiError(err?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  if (createdTicket) {
    return (
      <div className="container py-4" style={{ maxWidth: 640 }}>
        <div className="card shadow-sm border-0 p-4 text-center" data-testid="ticket-success-card">
          <div className="text-success mb-3" style={{ fontSize: 48 }}>✓</div>
          <h2 className="h4 fw-bold mb-2">Ticket Submitted Successfully</h2>
          <p className="text-muted small">Your support request has been logged into TockTickIT.</p>
          <div className="alert alert-success my-3 py-3">
            <div className="small text-uppercase tracking-wider fw-semibold text-muted mb-1">Official Ticket Number</div>
            <div className="h3 fw-bold mb-0 text-success" data-testid="official-ticket-number">
              {createdTicket.ticketNumber}
            </div>
          </div>
          <div className="d-flex justify-content-center gap-3 mt-3">
            <button className="btn btn-success" onClick={onSuccess} data-testid="view-my-tickets-btn">
              View My Tickets
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setCreatedTicket(null);
                setSummary("");
                setDescription("");
              }}
            >
              Create Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <div className="card shadow-sm border-0 p-4 p-sm-5" style={{ backgroundColor: "#FFFFFF", borderRadius: 12 }}>
        <h2 className="h4 fw-bold mb-3 text-dark">Create IT Support Ticket</h2>

        {activeRequester && (
          <div className="p-3 mb-4 rounded bg-light border d-flex flex-wrap gap-4">
            <div>
              <span className="small text-muted d-block">Requester</span>
              <span className="fw-semibold small">{activeRequester.name}</span>
            </div>
            <div>
              <span className="small text-muted d-block">Created Date</span>
              <span className="fw-semibold small">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {apiError && (
          <div className="alert alert-danger mb-4" role="alert" data-testid="create-ticket-error">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label htmlFor="categoryId" className="form-label fw-semibold text-secondary small">
                Category <span className="text-danger">*</span>
              </label>
              <select
                id="categoryId"
                className={`form-select ${errors.categoryId ? "is-invalid" : ""}`}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                data-testid="category-select"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <div className="invalid-feedback d-block">{errors.categoryId}</div>}
            </div>

            <div className="col-md-6">
              <label htmlFor="relatedSystemId" className="form-label fw-semibold text-secondary small">
                Related System <span className="text-danger">*</span>
              </label>
              <select
                id="relatedSystemId"
                className={`form-select ${errors.relatedSystemId ? "is-invalid" : ""}`}
                value={relatedSystemId}
                onChange={(e) => setRelatedSystemId(e.target.value)}
                data-testid="system-select"
              >
                {relatedSystems.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name}
                  </option>
                ))}
              </select>
              {errors.relatedSystemId && <div className="invalid-feedback d-block">{errors.relatedSystemId}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="requestedPriority" className="form-label fw-semibold text-secondary small">
              Requested Priority
            </label>
            <select
              id="requestedPriority"
              className="form-select"
              value={requestedPriority}
              onChange={(e) => setRequestedPriority(e.target.value as Priority)}
              data-testid="priority-select"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="summary" className="form-label fw-semibold text-secondary small">
              Summary <span className="text-danger">*</span>
            </label>
            <input
              id="summary"
              type="text"
              className={`form-control ${errors.summary ? "is-invalid" : ""}`}
              placeholder="Brief summary of your IT issue..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={255}
              data-testid="summary-input"
            />
            {errors.summary && (
              <div className="invalid-feedback d-block" data-testid="summary-error">
                {errors.summary}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="form-label fw-semibold text-secondary small">
              Description
            </label>
            <textarea
              id="description"
              className="form-control"
              rows={4}
              placeholder="Provide detailed information about your problem..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: "vertical", minHeight: 120 }}
              data-testid="description-input"
            />
          </div>

          <div className="d-flex align-items-center justify-content-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={submitting}
              data-testid="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn text-white fw-semibold px-4"
              style={{ backgroundColor: "#006B3C" }}
              disabled={submitting}
              data-testid="submit-ticket-btn"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
