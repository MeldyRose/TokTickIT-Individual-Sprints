import React, { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setEmailError("");
    setPasswordError("");

    let hasError = false;
    if (!email.trim()) {
      setEmailError("Email address is required.");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Password is required.");
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMessage(
        typeof err?.message === "string" && err.message
          ? err.message
          : "Invalid email or password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{ backgroundColor: "#F5F7F6" }}
      data-testid="login-page"
    >
      <div
        className="card shadow-sm border-0 w-100 p-4 p-md-5"
        style={{ maxWidth: "440px", borderRadius: "12px" }}
      >
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center mb-2">
            <span className="h3 mb-0 fw-bold tracking-tight me-2" style={{ color: "#006B3C" }}>
              TokTickIT
            </span>
            <span className="badge" style={{ backgroundColor: "#EAF6EF", color: "#006B3C" }}>
              IT Service Desk
            </span>
          </div>
          <h1 className="h4 fw-bold text-dark mb-1">Sign In</h1>
          <p className="small text-muted mb-0">Sign in to your account to continue</p>
        </div>

        {errorMessage && (
          <div
            className="alert border-0 small mb-4 py-2 px-3 d-flex align-items-center"
            style={{ backgroundColor: "#FFEBEE", color: "#C62828", borderColor: "#FFCDD2" }}
            role="alert"
            data-testid="login-error-banner"
          >
            <span className="me-2">⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label small fw-semibold text-secondary">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className={`form-control ${emailError ? "is-invalid" : ""}`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              autoFocus
              required
              data-testid="login-email-input"
            />
            {emailError && (
              <div className="invalid-feedback d-block small" data-testid="email-error">
                {emailError}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="login-password" className="form-label small fw-semibold text-secondary">
              Password
            </label>
            <div className="input-group">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={`form-control ${passwordError ? "is-invalid" : ""}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                required
                data-testid="login-password-input"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                data-testid="toggle-password-btn"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {passwordError && (
              <div className="invalid-feedback d-block small" data-testid="password-error">
                {passwordError}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn w-100 py-2 fw-semibold text-white"
            style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
            disabled={isSubmitting}
            data-testid="login-submit-btn"
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
