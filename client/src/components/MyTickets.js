import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { fetchMyTickets, fetchCategories, fetchRelatedSystems, } from "../api";
import { useRequester } from "../context/RequesterContext";
import { StatusBadge, PriorityBadge } from "./Badge";
export const MyTickets = ({ onCreateTicketClick, onSelectTicket }) => {
    const { activeRequester } = useRequester();
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [relatedSystems, setRelatedSystems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Filters and pagination state
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [status, setStatus] = useState("");
    const [relatedSystemId, setRelatedSystemId] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    useEffect(() => {
        Promise.all([fetchCategories(), fetchRelatedSystems()])
            .then(([cats, syss]) => {
            setCategories(cats);
            setRelatedSystems(syss);
        })
            .catch(() => {
            // ignore
        });
    }, []);
    const loadTickets = async () => {
        if (!activeRequester)
            return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetchMyTickets({
                page,
                limit: 10,
                search,
                categoryId,
                status,
                relatedSystemId,
                sortBy,
                order,
            }, activeRequester.id);
            setTickets(res.data);
            setTotalPages(res.pagination.totalPages);
            setTotalItems(res.pagination.totalItems);
        }
        catch (err) {
            setError(err?.message || "Failed to load tickets");
        }
        finally {
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
    return (_jsxs("div", { className: "container py-4", children: [_jsxs("div", { className: "d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "h3 fw-bold mb-1 text-dark", children: "My Tickets" }), _jsx("p", { className: "text-muted small mb-0", children: "Track and manage your submitted IT support tickets." })] }), _jsx("button", { className: "btn text-white fw-semibold px-3 py-2", style: { backgroundColor: "#006B3C" }, onClick: onCreateTicketClick, "data-testid": "create-ticket-action-btn", children: "+ Create Ticket" })] }), _jsxs("div", { className: "card shadow-sm border-0 p-3 mb-4", style: { borderRadius: 10 }, children: [_jsxs("div", { className: "row g-2", children: [_jsx("div", { className: "col-12 col-md-4", children: _jsx("input", { type: "text", className: "form-control", placeholder: "Search by keyword or ticket #...", value: search, onChange: (e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }, "data-testid": "search-input" }) }), _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select", value: categoryId, onChange: (e) => {
                                        setCategoryId(e.target.value);
                                        setPage(1);
                                    }, "data-testid": "category-filter", children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] }) }), _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select", value: status, onChange: (e) => {
                                        setStatus(e.target.value);
                                        setPage(1);
                                    }, "data-testid": "status-filter", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "NEW", children: "New" }), _jsx("option", { value: "IN_PROGRESS", children: "In Progress" }), _jsx("option", { value: "RESOLVED", children: "Resolved" }), _jsx("option", { value: "CLOSED", children: "Closed" })] }) }), _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select", value: relatedSystemId, onChange: (e) => {
                                        setRelatedSystemId(e.target.value);
                                        setPage(1);
                                    }, "data-testid": "system-filter", children: [_jsx("option", { value: "", children: "All Systems" }), relatedSystems.map((sys) => (_jsx("option", { value: sys.id, children: sys.name }, sys.id)))] }) }), _jsx("div", { className: "col-6 col-md-2 d-flex gap-2", children: _jsxs("select", { className: "form-select", value: `${sortBy}-${order}`, onChange: (e) => {
                                        const [sb, ord] = e.target.value.split("-");
                                        setSortBy(sb);
                                        setOrder(ord);
                                        setPage(1);
                                    }, "data-testid": "sort-select", children: [_jsx("option", { value: "createdAt-desc", children: "Newest First" }), _jsx("option", { value: "createdAt-asc", children: "Oldest First" }), _jsx("option", { value: "requestedPriority-desc", children: "Priority High-to-Low" }), _jsx("option", { value: "requestedPriority-asc", children: "Priority Low-to-High" })] }) })] }), isFiltered && (_jsx("div", { className: "mt-2 text-end", children: _jsx("button", { className: "btn btn-link text-success p-0 small text-decoration-none fw-semibold", onClick: handleClearFilters, "data-testid": "clear-filters-btn", children: "Clear Filters" }) }))] }), loading && (_jsxs("div", { className: "text-center py-5", "data-testid": "tickets-loading", children: [_jsx("div", { className: "spinner-border text-success", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading tickets..." }) }), _jsx("p", { className: "small text-muted mt-2", children: "Loading tickets..." })] })), error && (_jsx("div", { className: "alert alert-danger", role: "alert", "data-testid": "tickets-error", children: error })), !loading && !error && tickets.length === 0 && (_jsxs("div", { className: "card shadow-sm border-0 p-5 text-center my-4", "data-testid": "empty-tickets-state", children: [_jsx("div", { className: "mb-3 text-muted", style: { fontSize: 36 }, children: "\uD83C\uDFAB" }), _jsx("h3", { className: "h5 fw-bold text-secondary", children: isFiltered ? "No Matching Tickets Found" : "No Tickets Submitted Yet" }), _jsx("p", { className: "text-muted small mb-3", children: isFiltered
                            ? "Try adjusting or clearing your search and filter criteria."
                            : "You haven't submitted any IT support tickets yet." }), _jsx("div", { children: isFiltered ? (_jsx("button", { className: "btn btn-outline-success btn-sm", onClick: handleClearFilters, "data-testid": "no-results-clear-btn", children: "Clear Filters" })) : (_jsx("button", { className: "btn btn-success btn-sm", onClick: onCreateTicketClick, children: "Create Your First Ticket" })) })] })), !loading && !error && tickets.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "d-none d-lg-block card shadow-sm border-0 mb-4 overflow-hidden", "data-testid": "desktop-table-view", children: _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table align-middle mb-0", children: [_jsx("thead", { className: "table-light", children: _jsxs("tr", { className: "small text-secondary", children: [_jsx("th", { children: "Ticket No." }), _jsx("th", { children: "Created Date" }), _jsx("th", { children: "Summary" }), _jsx("th", { children: "Category" }), _jsx("th", { children: "Related System" }), _jsx("th", { children: "Priority" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: tickets.map((t) => (_jsxs("tr", { "data-testid": `ticket-row-${t.id}`, onClick: () => onSelectTicket?.(t.id), style: { cursor: "pointer" }, children: [_jsx("td", { children: _jsx("button", { type: "button", className: "btn btn-link p-0 font-monospace fw-bold text-success text-decoration-none", onClick: (e) => {
                                                            e.stopPropagation();
                                                            onSelectTicket?.(t.id);
                                                        }, "data-testid": `ticket-link-${t.id}`, children: t.ticketNumber }) }), _jsx("td", { className: "small text-muted", children: new Date(t.createdAt).toLocaleDateString() }), _jsx("td", { className: "fw-semibold text-dark", children: t.summary }), _jsx("td", { children: _jsx("span", { className: "badge bg-light text-dark border", children: t.categoryName }) }), _jsx("td", { children: _jsx("span", { className: "badge bg-light text-dark border", children: t.relatedSystemName }) }), _jsx("td", { children: _jsx(PriorityBadge, { priority: t.requestedPriority }) }), _jsx("td", { children: _jsx(StatusBadge, { status: t.currentStatus }) })] }, t.id))) })] }) }) }), _jsx("div", { className: "d-lg-none d-flex flex-column gap-3 mb-4", "data-testid": "mobile-cards-view", children: tickets.map((t) => (_jsxs("div", { className: "card shadow-sm border-0 p-3", style: { borderRadius: 10, cursor: "pointer" }, onClick: () => onSelectTicket?.(t.id), children: [_jsxs("div", { className: "d-flex align-items-center justify-content-between mb-2", children: [_jsx("span", { className: "font-monospace fw-bold text-success small", children: t.ticketNumber }), _jsx(StatusBadge, { status: t.currentStatus })] }), _jsx("h3", { className: "h6 fw-bold text-dark mb-2", children: t.summary }), _jsxs("div", { className: "d-flex flex-wrap gap-2 mb-2", children: [_jsx("span", { className: "badge bg-light text-dark border", children: t.categoryName }), _jsx("span", { className: "badge bg-light text-dark border", children: t.relatedSystemName }), _jsx(PriorityBadge, { priority: t.requestedPriority })] }), _jsxs("div", { className: "small text-muted text-end", children: ["Submitted ", new Date(t.createdAt).toLocaleDateString()] })] }, t.id))) }), _jsxs("div", { className: "d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3", "data-testid": "pagination-bar", children: [_jsxs("span", { className: "small text-muted", "data-testid": "pagination-info", children: ["Showing ", (page - 1) * 10 + 1, " to ", Math.min(page * 10, totalItems), " of ", totalItems, " tickets"] }), _jsxs("div", { className: "btn-group", children: [_jsx("button", { className: "btn btn-outline-secondary btn-sm", disabled: page <= 1, onClick: () => setPage((p) => Math.max(1, p - 1)), "data-testid": "prev-page-btn", children: "Previous" }), _jsxs("button", { className: "btn btn-outline-secondary btn-sm disabled", "aria-disabled": "true", children: ["Page ", page, " of ", totalPages] }), _jsx("button", { className: "btn btn-outline-secondary btn-sm", disabled: page >= totalPages, onClick: () => setPage((p) => Math.min(totalPages, p + 1)), "data-testid": "next-page-btn", children: "Next" })] })] })] }))] }));
};
