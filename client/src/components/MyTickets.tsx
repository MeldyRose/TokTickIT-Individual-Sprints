import React, { useState, useEffect } from "react";
import {
  fetchMyTickets,
  fetchCategories,
  fetchRelatedSystems,
  Ticket,
  Category,
  RelatedSystem,
} from "../api";
import { useRequester } from "../context/RequesterContext";
import { StatusBadge, PriorityBadge } from "./Badge";

interface MyTicketsProps {
  onCreateTicketClick: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ onCreateTicketClick }) => {
  const { activeRequester } = useRequester();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and pagination state
  const [search, setSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [order, setOrder] = useState<string>("desc");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchRelatedSystems()])
      .then(([cats, syss]) => {
        setCategories(cats);
        setRelatedSystems(syss);
      })
      .catch(() => {
        // ignore reference fetch errors for filter dropdowns
      });
  }, []);

  const loadTickets = async () => {
    if (!activeRequester) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyTickets(
        {
          page,
          limit: 10,
          search,
          categoryId,
          status,
          relatedSystemId,
          sortBy,
          order,
        },
        activeRequester.id
      );
      setTickets(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.totalItems);
    } catch (err: any) {
      setError(err?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [activeRequester, page, search, categoryId, status, relatedSystemId, sortBy, order]);

  const handleClearFilters = () => {
    setSearch("");
    setCategoryId("");
    setStatus("");
    setRelatedSystemId("");
    setSortBy("createdAt");
    setOrder("desc");
    setPage(1);
  };

  const isFiltered = search !== "" || categoryId !== "" || status !== "" || relatedSystemId !== "";

  return (
    <div className="container py-4">
      {/* Top Header & Control Bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">My Tickets</h1>
          <p className="text-muted small mb-0">Track and manage your submitted IT support tickets.</p>
        </div>
        <button
          className="btn text-white fw-semibold px-3 py-2"
          style={{ backgroundColor: "#006B3C" }}
          onClick={onCreateTicketClick}
          data-testid="create-ticket-action-btn"
        >
          + Create Ticket
        </button>
      </div>

      {/* Control Bar: Filters, Search, Sort */}
      <div className="card shadow-sm border-0 p-3 mb-4" style={{ borderRadius: 10 }}>
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search by keyword or ticket #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              data-testid="search-input"
            />
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              data-testid="category-filter"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              data-testid="status-filter"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={relatedSystemId}
              onChange={(e) => {
                setRelatedSystemId(e.target.value);
                setPage(1);
              }}
              data-testid="system-filter"
            >
              <option value="">All Systems</option>
              {relatedSystems.map((sys) => (
                <option key={sys.id} value={sys.id}>
                  {sys.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2 d-flex gap-2">
            <select
              className="form-select"
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sb, ord] = e.target.value.split("-");
                setSortBy(sb);
                setOrder(ord);
                setPage(1);
              }}
              data-testid="sort-select"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="requestedPriority-desc">Priority High-to-Low</option>
              <option value="requestedPriority-asc">Priority Low-to-High</option>
            </select>
          </div>
        </div>

        {isFiltered && (
          <div className="mt-2 text-end">
            <button
              className="btn btn-link text-success p-0 small text-decoration-none fw-semibold"
              onClick={handleClearFilters}
              data-testid="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-5" data-testid="tickets-loading">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading tickets...</span>
          </div>
          <p className="small text-muted mt-2">Loading tickets...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="alert alert-danger" role="alert" data-testid="tickets-error">
          {error}
        </div>
      )}

      {/* Empty / No Results State */}
      {!loading && !error && tickets.length === 0 && (
        <div className="card shadow-sm border-0 p-5 text-center my-4" data-testid="empty-tickets-state">
          <div className="mb-3 text-muted" style={{ fontSize: 36 }}>🎫</div>
          <h3 className="h5 fw-bold text-secondary">
            {isFiltered ? "No Matching Tickets Found" : "No Tickets Submitted Yet"}
          </h3>
          <p className="text-muted small mb-3">
            {isFiltered
              ? "Try adjusting or clearing your search and filter criteria."
              : "You haven't submitted any IT support tickets yet."}
          </p>
          <div>
            {isFiltered ? (
              <button
                className="btn btn-outline-success btn-sm"
                onClick={handleClearFilters}
                data-testid="no-results-clear-btn"
              >
                Clear Filters
              </button>
            ) : (
              <button
                className="btn btn-success btn-sm"
                onClick={onCreateTicketClick}
              >
                Create Your First Ticket
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ticket Content: Desktop Table (>=992px) & Mobile Cards (<768px) */}
      {!loading && !error && tickets.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="d-none d-lg-block card shadow-sm border-0 mb-4 overflow-hidden" data-testid="desktop-table-view">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-secondary">
                    <th>Ticket No.</th>
                    <th>Created Date</th>
                    <th>Summary</th>
                    <th>Category</th>
                    <th>Related System</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} data-testid={`ticket-row-${t.id}`}>
                      <td>
                        <span className="font-monospace fw-bold text-success">{t.ticketNumber}</span>
                      </td>
                      <td className="small text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="fw-semibold text-dark">{t.summary}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{t.categoryName}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{t.relatedSystemName}</span>
                      </td>
                      <td>
                        <PriorityBadge priority={t.requestedPriority} />
                      </td>
                      <td>
                        <StatusBadge status={t.currentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Card View (<992px) */}
          <div className="d-lg-none d-flex flex-column gap-3 mb-4" data-testid="mobile-cards-view">
            {tickets.map((t) => (
              <div key={t.id} className="card shadow-sm border-0 p-3" style={{ borderRadius: 10 }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="font-monospace fw-bold text-success small">{t.ticketNumber}</span>
                  <StatusBadge status={t.currentStatus} />
                </div>
                <h3 className="h6 fw-bold text-dark mb-2">{t.summary}</h3>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <span className="badge bg-light text-dark border">{t.categoryName}</span>
                  <span className="badge bg-light text-dark border">{t.relatedSystemName}</span>
                  <PriorityBadge priority={t.requestedPriority} />
                </div>
                <div className="small text-muted text-end">
                  Submitted {new Date(t.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Bar */}
          <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3" data-testid="pagination-bar">
            <span className="small text-muted" data-testid="pagination-info">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalItems)} of {totalItems} tickets
            </span>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="prev-page-btn"
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary btn-sm disabled"
                aria-disabled="true"
              >
                Page {page} of {totalPages}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                data-testid="next-page-btn"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
