import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { fetchCategories, fetchRelatedSystems, createTicket } from "../api";
import { useRequester } from "../context/RequesterContext";
export const CreateTicket = ({ onSuccess, onCancel }) => {
    const { activeRequester } = useRequester();
    const [categories, setCategories] = useState([]);
    const [relatedSystems, setRelatedSystems] = useState([]);
    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [relatedSystemId, setRelatedSystemId] = useState("");
    const [requestedPriority, setRequestedPriority] = useState("MEDIUM");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState(null);
    const [createdTicket, setCreatedTicket] = useState(null);
    useEffect(() => {
        let isMounted = true;
        Promise.all([fetchCategories(), fetchRelatedSystems()])
            .then(([cats, syss]) => {
            if (isMounted) {
                setCategories(cats);
                setRelatedSystems(syss);
                if (cats.length > 0)
                    setCategoryId(cats[0].id);
                if (syss.length > 0)
                    setRelatedSystemId(syss[0].id);
            }
        })
            .catch((err) => {
            if (isMounted)
                setApiError(err?.message || "Failed to load reference data");
        });
        return () => {
            isMounted = false;
        };
    }, []);
    const validate = () => {
        const errs = {};
        if (!summary || summary.trim().length === 0) {
            errs.summary = "Summary is required";
        }
        else if (summary.trim().length > 255) {
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
    const handleSubmit = async (e) => {
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
            const ticket = await createTicket({
                summary: summary.trim(),
                description: description.trim() || undefined,
                categoryId,
                relatedSystemId,
                requestedPriority,
            }, activeRequester.id);
            setCreatedTicket(ticket);
        }
        catch (err) {
            setApiError(err?.message || "Failed to create ticket");
        }
        finally {
            setSubmitting(false);
        }
    };
    if (createdTicket) {
        return (_jsx("div", { className: "container py-4", style: { maxWidth: 640 }, children: _jsxs("div", { className: "card shadow-sm border-0 p-4 text-center", "data-testid": "ticket-success-card", children: [_jsx("div", { className: "text-success mb-3", style: { fontSize: 48 }, children: "\u2713" }), _jsx("h2", { className: "h4 fw-bold mb-2", children: "Ticket Submitted Successfully" }), _jsx("p", { className: "text-muted small", children: "Your support request has been logged into TockTickIT." }), _jsxs("div", { className: "alert alert-success my-3 py-3", children: [_jsx("div", { className: "small text-uppercase tracking-wider fw-semibold text-muted mb-1", children: "Official Ticket Number" }), _jsx("div", { className: "h3 fw-bold mb-0 text-success", "data-testid": "official-ticket-number", children: createdTicket.ticketNumber })] }), _jsxs("div", { className: "d-flex justify-content-center gap-3 mt-3", children: [_jsx("button", { className: "btn btn-success", onClick: onSuccess, "data-testid": "view-my-tickets-btn", children: "View My Tickets" }), _jsx("button", { className: "btn btn-outline-secondary", onClick: () => {
                                    setCreatedTicket(null);
                                    setSummary("");
                                    setDescription("");
                                }, children: "Create Another Ticket" })] })] }) }));
    }
    return (_jsx("div", { className: "container py-4", style: { maxWidth: 720 }, children: _jsxs("div", { className: "card shadow-sm border-0 p-4 p-sm-5", style: { backgroundColor: "#FFFFFF", borderRadius: 12 }, children: [_jsx("h2", { className: "h4 fw-bold mb-3 text-dark", children: "Create IT Support Ticket" }), activeRequester && (_jsxs("div", { className: "p-3 mb-4 rounded bg-light border d-flex flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("span", { className: "small text-muted d-block", children: "Requester" }), _jsx("span", { className: "fw-semibold small", children: activeRequester.name })] }), _jsxs("div", { children: [_jsx("span", { className: "small text-muted d-block", children: "Created Date" }), _jsx("span", { className: "fw-semibold small", children: new Date().toLocaleDateString() })] })] })), apiError && (_jsx("div", { className: "alert alert-danger mb-4", role: "alert", "data-testid": "create-ticket-error", children: apiError })), _jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [_jsxs("div", { className: "row g-3 mb-3", children: [_jsxs("div", { className: "col-md-6", children: [_jsxs("label", { htmlFor: "categoryId", className: "form-label fw-semibold text-secondary small", children: ["Category ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("select", { id: "categoryId", className: `form-select ${errors.categoryId ? "is-invalid" : ""}`, value: categoryId, onChange: (e) => setCategoryId(e.target.value), "data-testid": "category-select", children: categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id))) }), errors.categoryId && _jsx("div", { className: "invalid-feedback d-block", children: errors.categoryId })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { htmlFor: "relatedSystemId", className: "form-label fw-semibold text-secondary small", children: ["Related System ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("select", { id: "relatedSystemId", className: `form-select ${errors.relatedSystemId ? "is-invalid" : ""}`, value: relatedSystemId, onChange: (e) => setRelatedSystemId(e.target.value), "data-testid": "system-select", children: relatedSystems.map((sys) => (_jsx("option", { value: sys.id, children: sys.name }, sys.id))) }), errors.relatedSystemId && _jsx("div", { className: "invalid-feedback d-block", children: errors.relatedSystemId })] })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { htmlFor: "requestedPriority", className: "form-label fw-semibold text-secondary small", children: "Requested Priority" }), _jsxs("select", { id: "requestedPriority", className: "form-select", value: requestedPriority, onChange: (e) => setRequestedPriority(e.target.value), "data-testid": "priority-select", children: [_jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" }), _jsx("option", { value: "URGENT", children: "Urgent" })] })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { htmlFor: "summary", className: "form-label fw-semibold text-secondary small", children: ["Summary ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { id: "summary", type: "text", className: `form-control ${errors.summary ? "is-invalid" : ""}`, placeholder: "Brief summary of your IT issue...", value: summary, onChange: (e) => setSummary(e.target.value), maxLength: 255, "data-testid": "summary-input" }), errors.summary && (_jsx("div", { className: "invalid-feedback d-block", "data-testid": "summary-error", children: errors.summary }))] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "description", className: "form-label fw-semibold text-secondary small", children: "Description" }), _jsx("textarea", { id: "description", className: "form-control", rows: 4, placeholder: "Provide detailed information about your problem...", value: description, onChange: (e) => setDescription(e.target.value), style: { resize: "vertical", minHeight: 120 }, "data-testid": "description-input" })] }), _jsxs("div", { className: "d-flex align-items-center justify-content-end gap-2 pt-2", children: [_jsx("button", { type: "button", className: "btn btn-outline-secondary", onClick: onCancel, disabled: submitting, "data-testid": "cancel-btn", children: "Cancel" }), _jsx("button", { type: "submit", className: "btn text-white fw-semibold px-4", style: { backgroundColor: "#006B3C" }, disabled: submitting, "data-testid": "submit-ticket-btn", children: submitting ? "Submitting..." : "Submit Ticket" })] })] })] }) }));
};
