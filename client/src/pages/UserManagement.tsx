import React, { useState, useEffect, FormEvent } from "react";
import {
  AdminUser,
  UserRole,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetUserInitialPassword,
} from "../api";
import { useAuth } from "../context/AuthContext";

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string>("");
  const [successToast, setSuccessToast] = useState<string>("");

  // Search & Filter controls
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);

  // Form states for Create User
  const [createName, setCreateName] = useState<string>("");
  const [createEmail, setCreateEmail] = useState<string>("");
  const [createRole, setCreateRole] = useState<UserRole>("REQUESTER");
  const [createIsActive, setCreateIsActive] = useState<boolean>(true);
  const [createPassword, setCreatePassword] = useState<string>("");
  const [showCreatePassword, setShowCreatePassword] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);

  // Form states for Edit User
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editRole, setEditRole] = useState<UserRole>("REQUESTER");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editError, setEditError] = useState<string>("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // Form states for Reset Password
  const [resetPassword, setResetPassword] = useState<string>("");
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>("");
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const data = await fetchAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
      });
      setUsers(data);
    } catch (err: any) {
      setPageError(err?.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const triggerToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast("");
    }, 4000);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateName("");
    setCreateEmail("");
    setCreateRole("REQUESTER");
    setCreateIsActive(true);
    setCreatePassword("");
    setCreateError("");
    setShowCreatePassword(false);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateError("");
  };

  // Submit Create User
  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!createName.trim()) {
      setCreateError("Full Name is required.");
      return;
    }
    if (!createEmail.trim()) {
      setCreateError("Email address is required.");
      return;
    }
    if (!createPassword) {
      setCreateError("Initial password is required.");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      await createAdminUser({
        name: createName,
        email: createEmail,
        role: createRole,
        isActive: createIsActive,
        initialPassword: createPassword,
      });
      handleCloseCreateModal();
      triggerToast("User account created successfully");
      loadUsers();
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create user");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditError("");
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setEditError("");
  };

  // Submit Edit User
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");

    if (!editName.trim()) {
      setEditError("Full Name is required.");
      return;
    }
    if (!editEmail.trim()) {
      setEditError("Email address is required.");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await updateAdminUser(editingUser.id, {
        name: editName,
        email: editEmail,
        role: editRole,
        isActive: editIsActive,
      });
      handleCloseEditModal();
      triggerToast("User account updated successfully");
      loadUsers();
    } catch (err: any) {
      setEditError(err?.message || "Failed to update user");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetModal = (user: AdminUser) => {
    setResetPasswordUser(user);
    setResetPassword("");
    setShowResetPassword(false);
    setResetError("");
  };

  const handleCloseResetModal = () => {
    setResetPasswordUser(null);
    setResetError("");
  };

  // Submit Reset Password
  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    setResetError("");

    if (!resetPassword) {
      setResetError("New initial password is required.");
      return;
    }

    setIsSubmittingReset(true);
    try {
      await resetUserInitialPassword(resetPasswordUser.id, resetPassword);
      handleCloseResetModal();
      triggerToast("Initial password reset successfully");
      loadUsers();
    } catch (err: any) {
      setResetError(err?.message || "Failed to reset password");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Password complexity helpers for Create & Reset modals
  const renderPasswordChecklist = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    return (
      <div
        className="p-3 mt-2 rounded border"
        style={{ backgroundColor: "#F8F9FA", borderColor: "#E9ECEF" }}
        data-testid="password-complexity-checklist"
      >
        <div className="small fw-semibold text-secondary mb-2">Password Complexity Criteria:</div>
        <div className="small d-flex align-items-center mb-1">
          <span className={`me-2 fw-bold ${hasMinLength ? "text-success" : "text-muted"}`}>
            {hasMinLength ? "✓" : "○"}
          </span>
          <span className={hasMinLength ? "text-dark" : "text-muted"}>At least 8 characters</span>
        </div>
        <div className="small d-flex align-items-center mb-1">
          <span className={`me-2 fw-bold ${hasUpper && hasLower ? "text-success" : "text-muted"}`}>
            {hasUpper && hasLower ? "✓" : "○"}
          </span>
          <span className={hasUpper && hasLower ? "text-dark" : "text-muted"}>
            Include upper and lower case letters
          </span>
        </div>
        <div className="small d-flex align-items-center">
          <span className={`me-2 fw-bold ${hasNumber && hasSpecial ? "text-success" : "text-muted"}`}>
            {hasNumber && hasSpecial ? "✓" : "○"}
          </span>
          <span className={hasNumber && hasSpecial ? "text-dark" : "text-muted"}>
            Include a number and a special character
          </span>
        </div>
      </div>
    );
  };

  // Helper for Role Badges
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case "ADMINISTRATOR":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#EDE7F6", color: "#4A148C", fontWeight: 600 }}
          >
            Administrator
          </span>
        );
      case "IT_STAFF":
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#E8F5E9", color: "#1B5E20", fontWeight: 600 }}
          >
            IT Staff
          </span>
        );
      case "REQUESTER":
      default:
        return (
          <span
            className="badge rounded-pill px-2 py-1"
            style={{ backgroundColor: "#E0F2F1", color: "#004D40", fontWeight: 600 }}
          >
            Requester
          </span>
        );
    }
  };

  // Helper for Status Pills
  const renderStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span
        className="badge rounded-pill px-2 py-1"
        style={{ backgroundColor: "#EAF6EF", color: "#006B3C", fontWeight: 600 }}
      >
        ● Active
      </span>
    ) : (
      <span
        className="badge rounded-pill px-2 py-1"
        style={{ backgroundColor: "#EEEEEE", color: "#616161", fontWeight: 600 }}
      >
        ○ Inactive
      </span>
    );
  };

  return (
    <div className="container py-4" data-testid="user-management-page">
      {/* Toast Banner */}
      {successToast && (
        <div
          className="alert alert-success border-0 shadow-sm position-fixed top-0 end-0 m-4 py-3 px-4"
          style={{ zIndex: 1080, backgroundColor: "#006B3C", color: "#FFFFFF", borderRadius: "8px" }}
          role="status"
          data-testid="success-toast"
        >
          ✓ {successToast}
        </div>
      )}

      {/* Main Container Card */}
      <div className="card border-0 shadow-sm p-4" style={{ borderRadius: "12px" }}>
        {/* Header Bar */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
          <div>
            <h1 className="h4 fw-bold mb-1" style={{ color: "#1A1D1C" }}>
              User Management
            </h1>
            <p className="text-muted small mb-0">
              Manage system accounts, user roles, active statuses, and initial password resets.
            </p>
          </div>
          <div>
            <button
              className="btn text-white fw-semibold px-3 py-2"
              style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
              onClick={handleOpenCreateModal}
              data-testid="create-user-btn"
            >
              + Create User
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-8">
            <input
              type="text"
              className="form-control"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="search-input"
            />
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              data-testid="role-filter-select"
            >
              <option value="ALL">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>
        </div>

        {/* Page level error banner */}
        {pageError && (
          <div
            className="alert border-0 mb-4 py-2 px-3"
            style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}
            role="alert"
            data-testid="user-management-error-banner"
          >
            ⚠️ {pageError}
          </div>
        )}

        {/* User Table & Cards */}
        {isLoading ? (
          <div className="text-center py-5" data-testid="user-management-loading">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading users...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-muted" data-testid="no-users-found">
            <p className="mb-0">No users found matching filter criteria.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>=768px) */}
            <div className="table-responsive d-none d-md-block">
              <table className="table align-middle hover mb-0" data-testid="user-table">
                <thead style={{ backgroundColor: "#F5F7F6" }}>
                  <tr className="text-muted small">
                    <th scope="col" className="ps-3 py-3">
                      Name
                    </th>
                    <th scope="col" className="py-3">
                      Email
                    </th>
                    <th scope="col" className="py-3">
                      Role
                    </th>
                    <th scope="col" className="py-3">
                      Status
                    </th>
                    <th scope="col" className="text-end pe-3 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} data-testid={`user-row-${u.id}`}>
                      <td className="ps-3 py-3 fw-semibold" style={{ color: "#1A1D1C" }}>
                        {u.name}
                      </td>
                      <td className="py-3 text-muted">{u.email}</td>
                      <td className="py-3">{renderRoleBadge(u.role)}</td>
                      <td className="py-3">{renderStatusBadge(u.isActive)}</td>
                      <td className="text-end pe-3 py-3">
                        <button
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={() => handleOpenEditModal(u)}
                          data-testid={`edit-user-btn-${u.id}`}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          style={{ borderColor: "#006B3C", color: "#006B3C" }}
                          onClick={() => handleOpenResetModal(u)}
                          data-testid={`reset-password-btn-${u.id}`}
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (<768px) */}
            <div className="d-md-none d-flex flex-column gap-3" data-testid="user-cards-mobile">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="card p-3 border"
                  style={{ borderRadius: "8px", borderColor: "#D8E0DC" }}
                  data-testid={`user-card-${u.id}`}
                >
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div>
                      <h3 className="h6 fw-bold mb-1">{u.name}</h3>
                      <p className="small text-muted mb-0">{u.email}</p>
                    </div>
                    <div>{renderStatusBadge(u.isActive)}</div>
                  </div>
                  <div className="mb-3">{renderRoleBadge(u.role)}</div>
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      className="btn btn-sm btn-outline-secondary flex-grow-1"
                      onClick={() => handleOpenEditModal(u)}
                      data-testid={`edit-user-btn-mobile-${u.id}`}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success flex-grow-1"
                      style={{ borderColor: "#006B3C", color: "#006B3C" }}
                      onClick={() => handleOpenResetModal(u)}
                      data-testid={`reset-password-btn-mobile-${u.id}`}
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
          data-testid="create-user-modal"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "520px" }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px" }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-start justify-content-between">
                <div>
                  <h2 className="modal-title h5 fw-bold text-dark mb-1">Create User Account</h2>
                  <p className="small text-muted mb-0">Create a new account with an initial password.</p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseCreateModal}
                  data-testid="close-create-modal-btn"
                ></button>
              </div>

              <div className="modal-body p-4">
                {createError && (
                  <div
                    className="alert border-0 small mb-3 py-2 px-3"
                    style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}
                    role="alert"
                    data-testid="create-user-error-banner"
                  >
                    ⚠️ {createError}
                  </div>
                )}

                <form onSubmit={handleCreateSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Alex Thompson"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      required
                      data-testid="create-user-name-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="user@toktickit.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      required
                      data-testid="create-user-email-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Role</label>
                    <select
                      className="form-select"
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as UserRole)}
                      data-testid="create-user-role-select"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Initial Password</label>
                    <div className="input-group">
                      <input
                        type={showCreatePassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Enter initial password"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        required
                        data-testid="create-user-password-input"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        tabIndex={-1}
                        data-testid="toggle-create-password-btn"
                      >
                        {showCreatePassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {renderPasswordChecklist(createPassword)}
                  </div>

                  <div className="mb-4 form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="createIsActive"
                      checked={createIsActive}
                      onChange={(e) => setCreateIsActive(e.target.checked)}
                      data-testid="create-user-active-switch"
                    />
                    <label className="form-check-label small fw-semibold text-secondary" htmlFor="createIsActive">
                      Account Active
                    </label>
                  </div>

                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={handleCloseCreateModal}
                      data-testid="cancel-create-user-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn text-white px-4 fw-semibold"
                      style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                      disabled={isSubmittingCreate}
                      data-testid="submit-create-user-btn"
                    >
                      {isSubmittingCreate ? "Creating..." : "Create User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (() => {
        const isSelfEdit = Boolean(
          currentUser?.id === editingUser.id ||
            (currentUser?.email && editingUser?.email && currentUser.email.toLowerCase() === editingUser.email.toLowerCase())
        );
        const activeAdminCount = users.filter((u) => u.role === "ADMINISTRATOR" && u.isActive).length;
        const isLastActiveAdmin = editingUser.role === "ADMINISTRATOR" && editingUser.isActive && activeAdminCount <= 1;

        return (
          <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
            data-testid="edit-user-modal"
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "520px" }}>
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px" }}>
                <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-start justify-content-between">
                  <div>
                    <h2 className="modal-title h5 fw-bold text-dark mb-1">Edit User Account</h2>
                    <p className="small text-muted mb-0">Update account details, role, or active status.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleCloseEditModal}
                    data-testid="close-edit-modal-btn"
                  ></button>
                </div>

                <div className="modal-body p-4">
                  {editError && (
                    <div
                      className="alert border-0 small mb-3 py-2 px-3"
                      style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}
                      role="alert"
                      data-testid="edit-user-error-banner"
                    >
                      ⚠️ {editError}
                    </div>
                  )}

                  <form onSubmit={handleEditSubmit} noValidate>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        data-testid="edit-user-name-input"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                        data-testid="edit-user-email-input"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary">Role</label>
                      <select
                        className="form-select"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        disabled={isLastActiveAdmin}
                        data-testid="edit-user-role-select"
                      >
                        <option value="REQUESTER">Requester</option>
                        <option value="IT_STAFF">IT Staff</option>
                        <option value="ADMINISTRATOR">Administrator</option>
                      </select>
                      {isLastActiveAdmin && (
                        <div className="form-text text-muted small mt-1">
                          🔒 Cannot change role of the last active Administrator.
                        </div>
                      )}
                    </div>

                    <div className="mb-4 form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="editIsActive"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        disabled={isSelfEdit || isLastActiveAdmin}
                        data-testid="edit-user-active-switch"
                      />
                      <label className="form-check-label small fw-semibold text-secondary" htmlFor="editIsActive">
                        Account Active
                      </label>
                      {isSelfEdit && (
                        <div className="form-text text-muted small mt-1">
                          🔒 Self-deactivation is prohibited. You cannot deactivate your logged-in account.
                        </div>
                      )}
                      {!isSelfEdit && isLastActiveAdmin && (
                        <div className="form-text text-muted small mt-1">
                          🔒 Cannot deactivate the last active Administrator.
                        </div>
                      )}
                    </div>

                    <div className="d-flex gap-2 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-4"
                        onClick={handleCloseEditModal}
                        data-testid="cancel-edit-user-btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn text-white px-4 fw-semibold"
                        style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                        disabled={isSubmittingEdit}
                        data-testid="submit-edit-user-btn"
                      >
                        {isSubmittingEdit ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* RESET INITIAL PASSWORD MODAL */}
      {resetPasswordUser && (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
          data-testid="reset-password-modal"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "520px" }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px" }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-start justify-content-between">
                <div>
                  <h2 className="modal-title h5 fw-bold text-dark mb-1">Reset Initial Password</h2>
                  <p className="small text-muted mb-0">Set a new initial password for {resetPasswordUser.name}.</p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseResetModal}
                  data-testid="close-reset-modal-btn"
                ></button>
              </div>

              <div className="modal-body p-4">
                {resetError && (
                  <div
                    className="alert border-0 small mb-3 py-2 px-3"
                    style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}
                    role="alert"
                    data-testid="reset-password-error-banner"
                  >
                    ⚠️ {resetError}
                  </div>
                )}

                <div className="alert alert-info border-0 small mb-3">
                  ℹ️ <strong>Note:</strong> User will be forced to change this password on their next login.
                </div>

                <form onSubmit={handleResetSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">New Initial Password</label>
                    <div className="input-group">
                      <input
                        type={showResetPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Enter new initial password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        required
                        data-testid="reset-password-input"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        tabIndex={-1}
                        data-testid="toggle-reset-password-btn"
                      >
                        {showResetPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {renderPasswordChecklist(resetPassword)}
                  </div>

                  <div className="d-flex gap-2 justify-content-end mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={handleCloseResetModal}
                      data-testid="cancel-reset-password-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn text-white px-4 fw-semibold"
                      style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                      disabled={isSubmittingReset}
                      data-testid="submit-reset-password-btn"
                    >
                      {isSubmittingReset ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
