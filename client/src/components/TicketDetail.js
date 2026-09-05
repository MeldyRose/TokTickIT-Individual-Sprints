import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { fetchTicketDetail } from "../api";
import { useRequester } from "../context/RequesterContext";
import { StatusBadge, PriorityBadge } from "./Badge";
export const TicketDetail = ({ ticketId, onBack }) => {
    const { activeRequester } = useRequester();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Tabs state for bottom section
    const [activeTab, setActiveTab] = useState("comments");
    // Local state for public comments
    const [comments, setComments] = useState([
        {
            id: "c-1",
            author: "Jennifer Anderson",
            role: "Requester",
            text: "Thank you for the update. Please let me know if you need any additional information.",
            date: "May 13, 2025 11:45 AM",
        },
        {
            id: "c-2",
            author: "Michael Brown",
            role: "IT Support",
            text: "We are investigating the issue on your device. We'll update you shortly.",
            date: "May 13, 2025 10:30 AM",
        },
        {
            id: "c-3",
            author: "Jennifer Anderson",
            role: "Requester",
            text: "Just adding that this issue occurs even when I close all applications.",
            date: "May 12, 2025 09:20 AM",
        },
    ]);
    const [newComment, setNewComment] = useState("");
    useEffect(() => {
        if (!activeRequester || !ticketId)
            return;
        setLoading(true);
        setError(null);
        fetchTicketDetail(ticketId, activeRequester.id)
            .then((data) => setTicket(data))
            .catch((err) => setError(err?.message || "Ticket not found or access denied"))
            .finally(() => setLoading(false));
    }, [ticketId, activeRequester]);
    const handleAddComment = (e) => {
        e.preventDefault();
        if (!newComment.trim() || !activeRequester)
            return;
        setComments((prev) => [
            {
                id: `c-${Date.now()}`,
                author: activeRequester.name,
                role: "Requester",
                text: newComment.trim(),
                date: new Date().toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                }),
            },
            ...prev,
        ]);
        setNewComment("");
    };
    if (loading) {
        return (_jsxs("div", { className: "container py-5 text-center", "data-testid": "detail-loading", children: [_jsx("div", { className: "spinner-border text-success", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading ticket details..." }) }), _jsx("p", { className: "small text-muted mt-2", children: "Loading ticket details..." })] }));
    }
    if (error || !ticket) {
        return (_jsx("div", { className: "container py-5", style: { maxWidth: 640 }, children: _jsxs("div", { className: "card shadow-sm border-0 p-5 text-center", "data-testid": "detail-access-denied", children: [_jsx("div", { className: "text-danger mb-3", style: { fontSize: 48 }, children: "\uD83D\uDEAB" }), _jsx("h2", { className: "h4 fw-bold text-dark mb-2", children: "Access Denied or Ticket Not Found" }), _jsx("p", { className: "text-muted small mb-4", children: error || "You do not have permission to view this ticket or it does not exist." }), _jsx("div", { children: _jsx("button", { className: "btn btn-success", onClick: onBack, "data-testid": "back-to-tickets-error-btn", children: "Back to My Tickets" }) })] }) }));
    }
    return (_jsxs("div", { className: "container py-4", style: { maxWidth: 1080 }, children: [_jsxs("div", { className: "d-flex align-items-center justify-content-between mb-4", children: [_jsxs("div", { className: "small text-secondary", children: [_jsx("span", { className: "text-decoration-underline", style: { cursor: "pointer" }, onClick: onBack, children: "My Tickets" }), " ", "> ", _jsx("span", { className: "fw-semibold text-dark", children: "Ticket Details" })] }), _jsx("button", { className: "btn btn-outline-success btn-sm font-monospace fw-semibold px-3", onClick: onBack, "data-testid": "back-to-tickets-btn", children: "\u2190 Back to My Tickets" })] }), _jsx("div", { className: "card shadow-sm border-0 p-4 mb-4", style: { borderRadius: 12, backgroundColor: "#FFFFFF" }, children: _jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12 col-md-3", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Ticket No." }), _jsx("input", { type: "text", className: "form-control form-control-sm bg-light font-monospace fw-bold", readOnly: true, value: ticket.ticketNumber, "data-testid": "detail-ticket-number" })] }), _jsxs("div", { className: "col-12 col-md-3", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Ticket Date" }), _jsx("input", { type: "text", className: "form-control form-control-sm bg-light", readOnly: true, value: new Date(ticket.createdAt).toLocaleString() })] }), _jsxs("div", { className: "col-12 col-md-3", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Category" }), _jsx("input", { type: "text", className: "form-control form-control-sm bg-light", readOnly: true, value: ticket.category?.name || "Hardware" })] }), _jsxs("div", { className: "col-12 col-md-3", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Related System" }), _jsx("input", { type: "text", className: "form-control form-control-sm bg-light", readOnly: true, value: ticket.relatedSystem?.name || "Corporate Laptop" })] }), _jsxs("div", { className: "col-12 col-md-3", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Requester" }), _jsx("input", { type: "text", className: "form-control form-control-sm bg-light", readOnly: true, value: ticket.requester?.name || "Jennifer Anderson" })] }), _jsxs("div", { className: "col-12 col-md-3", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Requested Priority" }), _jsx("div", { className: "form-control form-control-sm bg-light d-flex align-items-center", children: _jsx(PriorityBadge, { priority: ticket.requestedPriority }) })] }), _jsxs("div", { className: "col-12 col-md-3", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "IT Priority" }), _jsx("div", { className: "form-control form-control-sm bg-light d-flex align-items-center", children: _jsx(PriorityBadge, { priority: ticket.itPriority }) })] }), _jsxs("div", { className: "col-12 col-md-3", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Current Status" }), _jsx("div", { className: "form-control form-control-sm bg-light d-flex align-items-center", children: _jsx(StatusBadge, { status: ticket.currentStatus }) })] }), _jsxs("div", { className: "col-12 col-md-3", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Ticket Owner" }), _jsx("input", { type: "text", className: "form-control form-control-sm bg-light", readOnly: true, value: ticket.requester?.name ? `${ticket.requester.name} (IT Support)` : "Michael Brown (IT Support)" })] }), _jsxs("div", { className: "col-12 col-md-9", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Summary" }), _jsx("input", { type: "text", className: "form-control form-control-sm bg-light fw-semibold", readOnly: true, value: ticket.summary, "data-testid": "detail-summary" })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Description" }), _jsx("textarea", { className: "form-control form-control-sm bg-light font-monospace", rows: 3, readOnly: true, value: ticket.description || "No description provided." })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label small fw-semibold text-secondary mb-1", children: "Resolution Summary" }), _jsx("textarea", { className: "form-control form-control-sm bg-light text-muted fst-italic", rows: 2, readOnly: true, value: ticket.currentStatus === "RESOLVED" || ticket.currentStatus === "CLOSED"
                                        ? "Issue resolved."
                                        : "No resolution summary available yet." })] })] }) }), _jsxs("div", { className: "card shadow-sm border-0 p-4", style: { borderRadius: 12, backgroundColor: "#FFFFFF" }, children: [_jsxs("ul", { className: "nav nav-tabs border-bottom mb-4", children: [_jsx("li", { className: "nav-item", children: _jsxs("button", { className: `nav-link fw-semibold ${activeTab === "comments" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`, onClick: () => setActiveTab("comments"), children: ["\uD83D\uDCAC Public Comments ", _jsx("span", { className: "badge bg-success ms-1", children: comments.length })] }) }), _jsx("li", { className: "nav-item", children: _jsxs("button", { className: `nav-link fw-semibold ${activeTab === "attachments" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`, onClick: () => setActiveTab("attachments"), children: ["\uD83D\uDCCE Attachments ", _jsx("span", { className: "badge bg-secondary ms-1", children: ticket.attachments?.length || 0 })] }) }), _jsx("li", { className: "nav-item", children: _jsxs("button", { className: `nav-link fw-semibold ${activeTab === "actions" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`, onClick: () => setActiveTab("actions"), children: ["\uD83D\uDEE0 Service Actions ", _jsx("span", { className: "badge bg-secondary ms-1", children: "1" })] }) }), _jsx("li", { className: "nav-item", children: _jsxs("button", { className: `nav-link fw-semibold ${activeTab === "events" ? "active text-success border-bottom border-success border-2" : "text-secondary"}`, onClick: () => setActiveTab("events"), children: ["\u23F1 Event Log ", _jsx("span", { className: "badge bg-secondary ms-1", children: "6" })] }) })] }), activeTab === "comments" && (_jsxs("div", { children: [_jsxs("form", { onSubmit: handleAddComment, className: "mb-4", children: [_jsx("label", { htmlFor: "addComment", className: "form-label small fw-semibold text-secondary", children: "Add Comment" }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("input", { id: "addComment", type: "text", className: "form-control", placeholder: "Type your comment here...", value: newComment, onChange: (e) => setNewComment(e.target.value), "data-testid": "add-comment-input" }), _jsx("button", { type: "submit", className: "btn text-white fw-semibold px-4 text-nowrap", style: { backgroundColor: "#006B3C" }, disabled: !newComment.trim(), "data-testid": "post-comment-btn", children: "\u27A4 Post Comment" })] })] }), _jsx("div", { className: "d-flex flex-column gap-3", children: comments.map((c) => (_jsxs("div", { className: "p-3 rounded border bg-light d-flex gap-3 align-items-start", children: [_jsx("div", { className: "rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0", style: {
                                                width: 40,
                                                height: 40,
                                                backgroundColor: c.role === "IT Support" ? "#0B7A46" : "#2D6A4F",
                                            }, children: c.author
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("") }), _jsxs("div", { className: "flex-grow-1", children: [_jsxs("div", { className: "d-flex align-items-center justify-content-between mb-1", children: [_jsxs("div", { className: "d-flex align-items-center gap-2", children: [_jsx("span", { className: "fw-bold small text-dark", children: c.author }), _jsx("span", { className: `badge ${c.role === "IT Support" ? "bg-success" : "bg-secondary"}`, style: { fontSize: 10 }, children: c.role })] }), _jsx("span", { className: "small text-muted", children: c.date })] }), _jsx("p", { className: "mb-0 small text-secondary", children: c.text })] })] }, c.id))) })] })), activeTab === "attachments" && (_jsx("div", { children: ticket.attachments && ticket.attachments.length > 0 ? (_jsx("ul", { className: "list-group", children: ticket.attachments.map((att) => (_jsxs("li", { className: "list-group-item d-flex justify-content-between align-items-center", children: [_jsxs("span", { children: ["\uD83D\uDCCE ", att.fileName, " (", (att.fileSize / 1024).toFixed(1), " KB)"] }), _jsx("span", { className: "small text-muted", children: new Date(att.uploadedAt).toLocaleDateString() })] }, att.id))) })) : (_jsx("div", { className: "p-4 bg-light rounded text-center text-muted small", "data-testid": "empty-attachments", children: "No active attachments uploaded for this ticket." })) })), activeTab === "actions" && (_jsxs("div", { className: "p-3 bg-light rounded text-muted small", children: [_jsx("span", { className: "fw-bold", children: "Default Action:" }), " Ticket assigned to IT Support Queue."] })), activeTab === "events" && (_jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table table-sm small align-middle mb-0", children: [_jsx("thead", { className: "table-light", children: _jsxs("tr", { children: [_jsx("th", { children: "Timestamp" }), _jsx("th", { children: "Event Name" }), _jsx("th", { children: "Actor" })] }) }), _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { children: new Date(ticket.createdAt).toLocaleString() }), _jsxs("td", { children: [_jsx("span", { className: "badge bg-success", children: "TICKET_CREATED" }), " Ticket logged into TockTickIT"] }), _jsx("td", { children: ticket.requester?.name })] }), _jsxs("tr", { children: [_jsx("td", { children: new Date(ticket.createdAt).toLocaleString() }), _jsxs("td", { children: [_jsx("span", { className: "badge bg-info text-dark", children: "STATUS_SET" }), " Current status set to NEW"] }), _jsx("td", { children: "System Auto-Assign" })] })] })] }) }))] })] }));
};
