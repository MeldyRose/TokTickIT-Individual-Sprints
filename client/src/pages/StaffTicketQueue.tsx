import React, { useState, useEffect } from "react";
import {
  fetchTickets,
  fetchCategories,
  Category,
  Ticket,
  TicketListResponse,
  TicketStatus,
  Priority,
} from "../api";
import { StatusBadge, PriorityBadge } from "../components/Badge";

interface StaffTicketQueueProps {
  onSelectTicket: (ticketId: string) => void;
}

export const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({ onSelectTicket }) => {
  // Filters and Control States
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("createdAt-desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [ticketsData, setTicketsData] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  }>({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Handle 350ms debounce on search input
  useEffect(() => {
    if (searchInput === debouncedSearch) return;

    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset page on new search
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput, debouncedSearch]);

  // Load Categories on mount
  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {
        // ignore category fetch error gracefully
      });
  }, []);

  // Fetch Tickets when filters change
  useEffect(() => {
    let isSubscribed = true;
    setIsLoading(true);
    setError(null);

    const [sortBy, order] = sortOption.split("-");

    fetchTickets({
      page,
      pageSize,
      search: debouncedSearch,
      categoryId: categoryId || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      owner: ownerFilter === "all" ? undefined : ownerFilter,
      sortBy,
      sortOrder: order,
    })
      .then((res: TicketListResponse) => {
        if (!isSubscribed) return;
        setTicketsData(res.data || []);
        setPagination({
          page: res.pagination?.page || page,
          limit: res.pagination?.limit || res.pagination?.pageSize || pageSize,
          totalItems: res.pagination?.totalItems ?? res.pagination?.totalCount ?? 0,
          totalPages: res.pagination?.totalPages || 1,
        });
      })
      .catch((err: any) => {
        if (!isSubscribed) return;
        setError(err.message || "Failed to load ticket queue.");
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [debouncedSearch, categoryId, statusFilter, priorityFilter, ownerFilter, sortOption, page, pageSize]);

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setCategoryId("");
    setStatusFilter("");
    setPriorityFilter("");
    setOwnerFilter("all");
    setSortOption("createdAt-desc");
    setPage(1);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.totalItems);

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ maxWidth: 1400 }} data-testid="staff-ticket-queue">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">IT Staff Ticket Queue</h1>
          <p className="text-muted small mb-0">
            Centralized workbench for IT Staff and Administrators to manage and resolve tickets.
          </p>
        </div>
      </div>

      {/* Top Control Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3">
            {/* Search Input */}
            <div className="col-12 col-md-4 col-lg-3">
              <label htmlFor="queueSearch" className="form-label small fw-semibold text-secondary">
                Search
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white text-muted border-end-0">🔍</span>
                <input
                  id="queueSearch"
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Ticket No., summary, desc..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  data-testid="queue-search-input"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="queueCategory" className="form-label small fw-semibold text-secondary">
                Category
              </label>
              <select
                id="queueCategory"
                className="form-select form-select-sm"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                data-testid="queue-category-select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="queueStatus" className="form-label small fw-semibold text-secondary">
                Status
              </label>
              <select
                id="queueStatus"
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                data-testid="queue-status-select"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REOPENED">Reopened</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* IT Priority Filter */}
            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="queuePriority" className="form-label small fw-semibold text-secondary">
                IT Priority
              </label>
              <select
                id="queuePriority"
                className="form-select form-select-sm"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                data-testid="queue-priority-select"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Owner Filter */}
            <div className="col-6 col-md-4 col-lg-1.5">
              <label htmlFor="queueOwner" className="form-label small fw-semibold text-secondary">
                Ownership
              </label>
              <select
                id="queueOwner"
                className="form-select form-select-sm"
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value);
                  setPage(1);
                }}
                data-testid="queue-owner-select"
              >
                <option value="all">All Tickets</option>
                <option value="unassigned">Unassigned</option>
                <option value="me">Assigned to Me</option>
              </select>
            </div>

            {/* Sort & Clear Filters */}
            <div className="col-12 col-md-4 col-lg-1.5 d-flex align-items-end gap-2">
              <div className="flex-grow-1">
                <label htmlFor="queueSort" className="form-label small fw-semibold text-secondary">
                  Sort By
                </label>
                <select
                  id="queueSort"
                  className="form-select form-select-sm"
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    setPage(1);
                  }}
                  data-testid="queue-sort-select"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="itPriority-desc">Highest Priority</option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm text-nowrap"
                onClick={handleClearFilters}
                data-testid="queue-clear-filters-btn"
                title="Clear Filters"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="card border-0 shadow-sm p-5 text-center" data-testid="queue-loading">
          <div className="spinner-border text-success mx-auto mb-3" role="status">
            <span className="visually-hidden">Loading ticket queue...</span>
          </div>
          <div className="text-muted">Fetching IT Staff Ticket Queue...</div>
        </div>
      ) : error ? (
        <div className="alert alert-danger shadow-sm mb-4" role="alert">
          {error}
        </div>
      ) : ticketsData.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center" data-testid="no-results-message">
          <div className="fs-1 text-muted mb-2">📋</div>
          <h2 className="h5 fw-bold text-dark">No Tickets Found</h2>
          <p className="text-muted small max-w-md mx-auto mb-3">
            No tickets match your filter criteria or search query.
          </p>
          <div>
            <button
              className="btn btn-success btn-sm px-3"
              style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
              onClick={handleClearFilters}
              data-testid="queue-clear-filters-btn-empty"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>=992px) */}
          <div className="card border-0 shadow-sm mb-4 d-none d-lg-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: "#EAF6EF", color: "#1A1D1C" }}>
                  <tr>
                    <th scope="col" className="ps-3 py-3 small fw-bold">Ticket No.</th>
                    <th scope="col" className="py-3 small fw-bold">Created Date</th>
                    <th scope="col" className="py-3 small fw-bold">Summary</th>
                    <th scope="col" className="py-3 small fw-bold">Category</th>
                    <th scope="col" className="py-3 small fw-bold">Req. Priority</th>
                    <th scope="col" className="py-3 small fw-bold">IT Priority</th>
                    <th scope="col" className="py-3 small fw-bold">Status</th>
                    <th scope="col" className="py-3 small fw-bold">Owner</th>
                    <th scope="col" className="pe-3 py-3 small fw-bold text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsData.map((t) => (
                    <tr key={t.id} data-testid={`queue-row-${t.id}`}>
                      <td className="ps-3 fw-bold font-monospace text-success small">
                        {t.ticketNumber}
                      </td>
                      <td className="small text-muted">{formatDate(t.createdAt)}</td>
                      <td className="fw-semibold text-dark max-w-xs text-truncate" title={t.summary}>
                        {t.summary}
                      </td>
                      <td className="small text-secondary">
                        {t.categoryName || t.category?.name || "General"}
                      </td>
                      <td>
                        <PriorityBadge priority={t.requestedPriority} />
                      </td>
                      <td>
                        <PriorityBadge priority={t.itPriority || t.requestedPriority} />
                      </td>
                      <td>
                        <StatusBadge status={t.currentStatus} />
                      </td>
                      <td className="small">
                        {t.owner ? (
                          <span className="badge bg-light text-dark border fw-normal">
                            👤 {t.owner.name}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border fw-normal fst-italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="pe-3 text-end">
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => onSelectTicket(t.id)}
                          data-testid={`view-ticket-${t.id}`}
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (<992px) */}
          <div className="d-lg-none d-flex flex-column gap-3 mb-4">
            {ticketsData.map((t) => (
              <div key={t.id} className="card border-0 shadow-sm" data-testid={`queue-card-${t.id}`}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="fw-bold font-monospace text-success small me-2">
                        {t.ticketNumber}
                      </span>
                      <span className="text-muted extra-small">{formatDate(t.createdAt)}</span>
                    </div>
                    <StatusBadge status={t.currentStatus} />
                  </div>

                  <h2 className="h6 fw-bold text-dark mb-2">{t.summary}</h2>

                  <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <span className="badge bg-light text-secondary border fw-normal extra-small">
                      📁 {t.categoryName || t.category?.name || "General"}
                    </span>
                    <PriorityBadge priority={t.itPriority || t.requestedPriority} />
                    {t.owner ? (
                      <span className="badge bg-light text-dark border fw-normal extra-small">
                        👤 {t.owner.name}
                      </span>
                    ) : (
                      <span className="badge bg-light text-muted border fw-normal extra-small fst-italic">
                        Unassigned
                      </span>
                    )}
                  </div>

                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-sm btn-success w-100"
                      style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                      onClick={() => onSelectTicket(t.id)}
                      data-testid={`view-ticket-mobile-${t.id}`}
                    >
                      View Detail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Bar */}
          <div className="card border-0 shadow-sm p-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              {/* Counter */}
              <div className="small text-muted" data-testid="pagination-count">
                Showing <strong className="text-dark">{startItem}</strong> to{" "}
                <strong className="text-dark">{endItem}</strong> of{" "}
                <strong className="text-dark">{pagination.totalItems}</strong> tickets
              </div>

              {/* Page Size & Navigation Controls */}
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-1">
                  <label htmlFor="pageSizeSelect" className="small text-muted me-1">
                    Page Size:
                  </label>
                  <select
                    id="pageSizeSelect"
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    data-testid="page-size-select"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <nav aria-label="Ticket queue navigation">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${pagination.page <= 1 ? "disabled" : ""}`}>
                      <button
                        className="page-item btn btn-outline-secondary btn-sm me-1"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pagination.page <= 1}
                        data-testid="prev-page-btn"
                      >
                        Previous
                      </button>
                    </li>
                    <li className="page-item active">
                      <span
                        className="btn btn-success btn-sm me-1 px-3"
                        style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                      >
                        {pagination.page} / {pagination.totalPages || 1}
                      </span>
                    </li>
                    <li className={`page-item ${pagination.page >= pagination.totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-item btn btn-outline-secondary btn-sm"
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={pagination.page >= pagination.totalPages}
                        data-testid="next-page-btn"
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
