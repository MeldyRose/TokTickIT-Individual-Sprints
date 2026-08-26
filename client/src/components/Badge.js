import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const StatusBadge = ({ status }) => {
    switch (status) {
        case "NEW":
            return (_jsxs("span", { className: "badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold", style: { backgroundColor: "#E7F1FF", color: "#0D6EFD", borderRadius: 12 }, "data-testid": "status-badge-new", children: [_jsx("span", { children: "\u2022" }), " New"] }));
        case "IN_PROGRESS":
            return (_jsxs("span", { className: "badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold", style: { backgroundColor: "#FFF4E6", color: "#FD7E14", borderRadius: 12 }, "data-testid": "status-badge-in-progress", children: [_jsx("span", { children: "\u23F1" }), " In Progress"] }));
        case "RESOLVED":
            return (_jsxs("span", { className: "badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold", style: { backgroundColor: "#EAF6EF", color: "#006B3C", borderRadius: 12 }, "data-testid": "status-badge-resolved", children: [_jsx("span", { children: "\u2713" }), " Resolved"] }));
        case "CLOSED":
            return (_jsxs("span", { className: "badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold", style: { backgroundColor: "#E9ECEF", color: "#6C757D", borderRadius: 12 }, "data-testid": "status-badge-closed", children: [_jsx("span", { children: "\uD83D\uDD12" }), " Closed"] }));
        default:
            return _jsx("span", { className: "badge bg-secondary", children: status });
    }
};
export const PriorityBadge = ({ priority }) => {
    switch (priority) {
        case "LOW":
            return (_jsxs("span", { className: "badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold", style: { backgroundColor: "#E9ECEF", color: "#6C757D", borderRadius: 12 }, "data-testid": "priority-badge-low", children: [_jsx("span", { children: "\u2193" }), " Low"] }));
        case "MEDIUM":
            return (_jsxs("span", { className: "badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold", style: { backgroundColor: "#FFF3CD", color: "#856404", borderRadius: 12 }, "data-testid": "priority-badge-medium", children: [_jsx("span", { children: "=" }), " Medium"] }));
        case "HIGH":
            return (_jsxs("span", { className: "badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold", style: { backgroundColor: "#FFE8CC", color: "#FD7E14", borderRadius: 12 }, "data-testid": "priority-badge-high", children: [_jsx("span", { children: "\u2191" }), " High"] }));
        case "URGENT":
            return (_jsxs("span", { className: "badge d-inline-flex align-items-center gap-1 px-2.5 py-1 font-semibold fw-bold", style: { backgroundColor: "#F8D7DA", color: "#B7094C", borderRadius: 12 }, "data-testid": "priority-badge-urgent", children: [_jsx("span", { children: "!" }), " Urgent"] }));
        default:
            return _jsx("span", { className: "badge bg-secondary", children: priority });
    }
};
