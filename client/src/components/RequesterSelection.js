import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { fetchRequesters } from "../api";
import { useRequester } from "../context/RequesterContext";
export const RequesterSelection = () => {
    const { selectRequester } = useRequester();
    const [requesters, setRequesters] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loadRequesters = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchRequesters();
            setRequesters(data);
        }
        catch (err) {
            setError(err?.message || "Unable to load Development Requesters");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadRequesters();
    }, []);
    const handleContinue = (e) => {
        e.preventDefault();
        const found = requesters.find((r) => r.id === selectedId);
        if (found) {
            selectRequester(found);
        }
    };
    return (_jsx("div", { className: "container py-5", style: { maxWidth: 540 }, children: _jsx("div", { className: "card shadow-sm border-0", style: { borderRadius: 12, backgroundColor: "#FFFFFF" }, "data-testid": "requester-selection-card", children: _jsxs("div", { className: "card-body p-4 p-sm-5", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("h2", { className: "h4 fw-bold text-dark mb-2", "data-testid": "selection-title", children: "Select Development Requester" }), _jsx("p", { className: "text-muted small mb-0", style: { lineHeight: 1.5 }, children: "Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3." })] }), loading && (_jsxs("div", { className: "text-center py-4", "data-testid": "loading-state", children: [_jsx("div", { className: "spinner-border text-success", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading..." }) }), _jsx("p", { className: "small text-muted mt-2", children: "Loading active requesters..." })] })), error && (_jsxs("div", { className: "alert alert-danger mt-3", role: "alert", "data-testid": "error-state", children: [_jsx("div", { children: _jsx("strong", { children: "Failed to Load Requesters" }) }), _jsx("div", { className: "small mt-1", children: error }), _jsx("button", { className: "btn btn-outline-danger btn-sm mt-3", onClick: loadRequesters, children: "Retry" })] })), !loading && !error && requesters.length === 0 && (_jsx("div", { className: "alert alert-warning py-3 text-center", "data-testid": "empty-state", children: _jsx("p", { className: "mb-0 small", children: "No active Development Requesters available in the database." }) })), !loading && !error && requesters.length > 0 && (_jsxs("form", { onSubmit: handleContinue, children: [_jsxs("div", { className: "mb-4", children: [_jsxs("label", { htmlFor: "requesterSelect", className: "form-label fw-semibold text-secondary small", children: ["Active Development Requester ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsxs("select", { id: "requesterSelect", className: "form-select", value: selectedId, onChange: (e) => setSelectedId(e.target.value), "data-testid": "requester-select-dropdown", style: { height: 44 }, children: [_jsx("option", { value: "", disabled: true, children: "-- Select a Development Requester --" }), requesters.map((req) => (_jsxs("option", { value: req.id, children: [req.name, " (", req.email, ")"] }, req.id)))] })] }), _jsx("button", { type: "submit", className: "btn w-100 fw-semibold text-white py-2", style: { backgroundColor: "#006B3C", borderRadius: 6 }, disabled: !selectedId, "data-testid": "continue-btn", children: "Continue" })] }))] }) }) }));
};
