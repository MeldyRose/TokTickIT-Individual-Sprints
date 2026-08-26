import React from "react";
import { useRequester } from "../context/RequesterContext";

interface HeaderProps {
  activeTab: "my-tickets" | "create-ticket";
  onTabChange: (tab: "my-tickets" | "create-ticket") => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
export const Header: React.FC = () => {
  const { activeRequester, clearRequester } = useRequester();

  return (
    <header style={{ backgroundColor: "#006B3C", color: "#FFFFFF" }} className="py-3 px-4 shadow-sm mb-4">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        <div className="d-flex align-items-center me-4">
        <div className="d-flex align-items-center me-3">
          <span className="h4 mb-0 fw-bold tracking-tight text-white me-2">TokTickIT</span>
          <span className="badge bg-light text-success fw-semibold">IT Service Desk</span>
        </div>

        {activeRequester && (
          <nav className="d-flex align-items-center gap-2 my-2 my-md-0">
            <button
              className={`btn btn-sm ${activeTab === "my-tickets" ? "btn-light fw-bold text-success" : "btn-outline-light"}`}
              onClick={() => onTabChange("my-tickets")}
              data-testid="nav-my-tickets"
            >
              My Tickets
            </button>
            <button
              className={`btn btn-sm ${activeTab === "create-ticket" ? "btn-light fw-bold text-success" : "btn-outline-light"}`}
              onClick={() => onTabChange("create-ticket")}
              data-testid="nav-create-ticket"
            >
              Create Ticket
            </button>
          </nav>
        )}

        {activeRequester && (
          <div className="d-flex align-items-center gap-3 mt-2 mt-sm-0">
            <div className="text-end me-2">
              <div className="small text-white-50">Active Requester</div>
              <div className="fw-bold text-white small" data-testid="active-requester-display">
                {activeRequester.name}
              </div>
            </div>
            <button
              onClick={clearRequester}
              className="btn btn-outline-light btn-sm font-monospace"
              style={{ borderColor: "rgba(255, 255, 255, 0.6)" }}
              data-testid="change-requester-btn"
            >
              Change Requester
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
