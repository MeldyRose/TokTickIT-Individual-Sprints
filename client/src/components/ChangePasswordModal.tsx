import React, { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

interface ChangePasswordModalProps {
  onClose?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { user, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");

  // Show/Hide password toggles for each field
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Complexity rules helpers
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isComplexityValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const isMandatory = user?.mustChangePassword;

  const handleCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setErrorMessage("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!currentPassword) {
      setErrorMessage("Current (temporary) password is required.");
      return;
    }

    if (!isComplexityValid) {
      setErrorMessage("New password does not meet complexity requirements.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, confirmNewPassword);
      handleCancel();
    } catch (err: any) {
      setErrorMessage(
        typeof err?.message === "string" && err.message
          ? err.message
          : "Failed to change password. Please check your current password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      data-testid="change-password-modal"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "480px" }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px" }}>
          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-start justify-content-between">
            <div>
              <h2 className="modal-title h5 fw-bold text-dark mb-1">Change Password</h2>
              <p className="small text-muted mb-0">
                Update your password to keep your account secure.
              </p>
            </div>
            {!isMandatory && onClose && (
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={handleCancel}
                data-testid="close-password-modal-btn"
              ></button>
            )}
          </div>

          <div className="modal-body p-4">
            {errorMessage && (
              <div
                className="alert border-0 small mb-3 py-2 px-3 d-flex align-items-center"
                style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}
                role="alert"
                data-testid="change-password-error-banner"
              >
                <span className="me-2">⚠️</span>
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label
                  htmlFor="current-password"
                  className="form-label small fw-semibold text-secondary"
                >
                  Current (temporary) password
                </label>
                <div className="input-group">
                  <input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoFocus
                    data-testid="current-password-input"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    data-testid="toggle-current-password-btn"
                  >
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label
                  htmlFor="new-password"
                  className="form-label small fw-semibold text-secondary"
                >
                  New password
                </label>
                <div className="input-group mb-2">
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    data-testid="new-password-input"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    data-testid="toggle-new-password-btn"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Password complexity checklist */}
                <div
                  className="p-3 mt-2 rounded border"
                  style={{ backgroundColor: "#F8F9FA", borderColor: "#E9ECEF" }}
                  data-testid="password-complexity-checklist"
                >
                  <div className="small fw-semibold text-secondary mb-2">
                    Password Complexity Checklist:
                  </div>
                  <div className="small d-flex align-items-center mb-1">
                    <span className={`me-2 fw-bold ${hasMinLength ? "text-success" : "text-muted"}`}>
                      {hasMinLength ? "✓" : "○"}
                    </span>
                    <span className={hasMinLength ? "text-dark" : "text-muted"} data-testid="rule-min-length">
                      At least 8 characters
                    </span>
                  </div>
                  <div className="small d-flex align-items-center mb-1">
                    <span
                      className={`me-2 fw-bold ${hasUpper && hasLower ? "text-success" : "text-muted"}`}
                    >
                      {hasUpper && hasLower ? "✓" : "○"}
                    </span>
                    <span className={hasUpper && hasLower ? "text-dark" : "text-muted"} data-testid="rule-casing">
                      Include upper and lower case letters
                    </span>
                  </div>
                  <div className="small d-flex align-items-center">
                    <span
                      className={`me-2 fw-bold ${hasNumber && hasSpecial ? "text-success" : "text-muted"}`}
                    >
                      {hasNumber && hasSpecial ? "✓" : "○"}
                    </span>
                    <span className={hasNumber && hasSpecial ? "text-dark" : "text-muted"} data-testid="rule-number-special">
                      Include a number and a special character
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="confirm-new-password"
                  className="form-label small fw-semibold text-secondary"
                >
                  Confirm new password
                </label>
                <div className="input-group">
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    data-testid="confirm-password-input"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    data-testid="toggle-confirm-password-btn"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn w-100 py-2 fw-semibold text-white"
                style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                disabled={isSubmitting}
                data-testid="save-password-btn"
              >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Saving…
                    </>
                  ) : (
                    "Save New Password & Continue"
                  )}
                </button>
                {isMandatory && (
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-link text-muted small text-decoration-none"
                      onClick={logout}
                      data-testid="mandatory-logout-btn"
                    >
                      ← Sign in as a different user
                    </button>
                  </div>
                )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
