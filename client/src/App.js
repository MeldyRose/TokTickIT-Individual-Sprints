import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { checkSystem } from "./api";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import { Header } from "./components/Header";
import { RequesterSelection } from "./components/RequesterSelection";
import { CreateTicket } from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
import { TicketDetail } from "./components/TicketDetail";
function MainContent() {
    const { activeRequester } = useRequester();
    const [activeTab, setActiveTab] = useState("my-tickets");
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    // Health check baseline state (for Lab 1 compliance)
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    async function handleCheck() {
        setState("loading");
        setErrorMessage("");
        try {
            const result = await checkSystem();
            if (result.online) {
                setCategories(result.categories);
                setState("success");
            }
        }
        catch (err) {
            setErrorMessage(err?.message || "Unable to connect to TokTickIT API");
            setState("error");
        }
    }
    const handleSelectTicket = (ticketId) => {
        setSelectedTicketId(ticketId);
        setActiveTab("ticket-detail");
    };
    const handleBackToMyTickets = () => {
        setSelectedTicketId(null);
        setActiveTab("my-tickets");
    };
    return (_jsxs("div", { className: "min-vh-100", style: { backgroundColor: "#F5F7F6" }, children: [_jsx(Header, { activeTab: activeTab === "ticket-detail" ? "my-tickets" : activeTab, onTabChange: (tab) => {
                    setSelectedTicketId(null);
                    setActiveTab(tab);
                } }), !activeRequester ? (_jsx(RequesterSelection, {})) : (_jsx("main", { children: activeTab === "ticket-detail" && selectedTicketId ? (_jsx(TicketDetail, { ticketId: selectedTicketId, onBack: handleBackToMyTickets })) : activeTab === "create-ticket" ? (_jsx(CreateTicket, { onSuccess: handleBackToMyTickets, onCancel: handleBackToMyTickets })) : (_jsxs(_Fragment, { children: [_jsx(MyTickets, { onCreateTicketClick: () => {
                                setSelectedTicketId(null);
                                setActiveTab("create-ticket");
                            }, onSelectTicket: handleSelectTicket }), _jsx("div", { className: "container pb-5", style: { maxWidth: 640 }, children: _jsxs("div", { className: "card shadow-sm border-0 p-4", children: [_jsxs("h2", { className: "h5 mb-3", children: ["TokTickIT ", _jsx("span", { className: "text-success", children: "IT Service Desk Health" })] }), _jsx("button", { className: "btn btn-outline-success btn-sm", onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }), state === "success" && (_jsxs("div", { className: "alert alert-success mt-3", role: "status", children: [_jsxs("div", { children: [_jsx("strong", { children: "System Status:" }), " Online"] }), categories.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mt-2", children: _jsx("strong", { children: "Supported Request Categories:" }) }), _jsx("ul", { className: "mt-1 mb-0", children: categories.map((cat) => (_jsx("li", { children: cat.name }, cat.id))) })] }))] })), state === "error" && (_jsxs("div", { className: "alert alert-danger mt-3", role: "alert", children: [_jsxs("div", { children: [_jsx("strong", { children: "System Status:" }), " Offline"] }), _jsx("div", { children: errorMessage || "Unable to connect to TokTickIT API" })] }))] }) })] })) }))] }));
}
export default function App() {
    return (_jsx(RequesterProvider, { children: _jsx(MainContent, {}) }));
}
