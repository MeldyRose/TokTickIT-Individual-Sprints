import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../api";

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onChangePasswordClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = "my-tickets",
  onTabChange,
  onChangePasswordClick,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case "REQUESTER":
        return { backgroundColor: "#E0F2F1", color: "#004D40", label: "Requester" };
      case "IT_STAFF":
        return { backgroundColor: "#E8F5E9", color: "#1B5E20", label: "IT Staff" };
      case "ADMINISTRATOR":
        return { backgroundColor: "#EDE7F6", color: "#4A148C", label: "Administrator" };
      default:
        return { backgroundColor: "#E0F2F1", color: "#004D40", label: role };
    }
  };

  const badgeStyle = getRoleBadgeStyle(user.role);

  return (
    <header style={{ backgroundColor: "#006B3C", color: "#FFFFFF" }} className="py-3 px-4 shadow-sm mb-4">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        <div className="d-flex align-items-center me-4">
          <span className="h4 mb-0 fw-bold tracking-tight text-white me-2">TokTickIT</span>
          <span className="badge bg-light text-success fw-semibold">IT Service Desk</span>
        </div>

        {onTabChange && (
          <nav className="d-flex align-items-center gap-2 my-2 my-md-0">
            {user.role === "REQUESTER" && (
              <>
                <button
                  className={`btn btn-sm ${
                    activeTab === "my-tickets" ? "btn-light fw-bold text-success" : "btn-outline-light"
                  }`}
                  onClick={() => onTabChange("my-tickets")}
                  data-testid="nav-my-tickets"
                >
                  My Tickets
                </button>
                <button
                  className={`btn btn-sm ${
                    activeTab === "create-ticket" ? "btn-light fw-bold text-success" : "btn-outline-light"
                  }`}
                  onClick={() => onTabChange("create-ticket")}
                  data-testid="nav-create-ticket"
                >
                  Create Ticket
                </button>
              </>
            )}

            {user.role === "IT_STAFF" && (
              <>
                <button
                  className={`btn btn-sm ${
                    activeTab === "ticket-queue" || activeTab === "my-tickets"
                      ? "btn-light fw-bold text-success"
                      : "btn-outline-light"
                  }`}
                  onClick={() => onTabChange("ticket-queue")}
                  data-testid="nav-ticket-queue"
                >
                  Ticket Queue
                </button>
                <button
                  className={`btn btn-sm ${
                    activeTab === "create-ticket" ? "btn-light fw-bold text-success" : "btn-outline-light"
                  }`}
                  onClick={() => onTabChange("create-ticket")}
                  data-testid="nav-create-ticket"
                >
                  Create Ticket
                </button>
              </>
            )}

            {user.role === "ADMINISTRATOR" && (
              <button
                className={`btn btn-sm ${
                  activeTab === "user-management" ? "btn-light fw-bold text-success" : "btn-outline-light"
                }`}
                onClick={() => onTabChange("user-management")}
                data-testid="nav-user-management"
              >
                User Management
              </button>
            )}
          </nav>
        )}

        <div
          className="d-flex align-items-center gap-3 mt-2 mt-sm-0 position-relative"
          data-testid="authenticated-user-widget"
        >
          <div className="text-end me-1">
            <div className="d-flex align-items-center justify-content-end gap-2">
              <span className="fw-bold text-white small" data-testid="user-name-display">
                {user.name}
              </span>
              <span
                className="badge fw-semibold"
                style={{
                  backgroundColor: badgeStyle.backgroundColor,
                  color: badgeStyle.color,
                }}
                data-testid="user-role-badge"
              >
                {badgeStyle.label}
              </span>
            </div>
            <div className="small text-white-50">{user.email}</div>
          </div>

          <div className="dropdown">
            <button
              className="btn btn-outline-light btn-sm dropdown-toggle"
              type="button"
              id="userMenuDropdown"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              data-testid="profile-dropdown"
              aria-expanded={dropdownOpen}
            >
              Account
            </button>

            {dropdownOpen && (
              <div
                className="dropdown-menu dropdown-menu-end show mt-2 shadow border-0"
                style={{ right: 0, left: "auto" }}
              >
                <div className="dropdown-header small text-muted">
                  Logged in as <strong>{user.email}</strong>
                </div>
                {onChangePasswordClick && (
                  <button
                    className="dropdown-item small"
                    onClick={() => {
                      setDropdownOpen(false);
                      onChangePasswordClick();
                    }}
                    data-testid="change-password-btn"
                  >
                    🔒 Change Password
                  </button>
                )}
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item small text-danger fw-semibold"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  data-testid="logout-btn"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
