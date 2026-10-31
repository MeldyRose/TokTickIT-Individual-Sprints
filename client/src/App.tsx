import { useState, useEffect, useRef } from "react";
import { checkSystem, Category } from "./api";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header } from "./components/Header";
import { Login } from "./pages/Login";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { CreateTicket } from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
import { RequesterTicketDetail } from "./pages/RequesterTicketDetail";
import { StaffTicketQueue, QueueInitialFilters } from "./pages/StaffTicketQueue";
import { StaffDashboard } from "./pages/StaffDashboard";
import { RequesterDashboard } from "./pages/RequesterDashboard";
import { UserManagement } from "./pages/UserManagement";

type UiState = "idle" | "loading" | "success" | "error";

function getQueryParamsFromUrl(): { status?: string; resolvedRange?: string } {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || undefined;
    const resolvedRange = params.get("resolvedRange") || undefined;
    return { status, resolvedRange };
  } catch {
    return {};
  }
}

function getTabFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path.includes("/staff/dashboard") || hash === "#staff-dashboard") {
    return "staff-dashboard";
  }
  if (path.includes("/staff/tickets") || hash === "#ticket-queue") {
    return "ticket-queue";
  }
  if (path.includes("/admin/users") || hash === "#user-management") {
    return "user-management";
  }
  if (
    path.includes("/requester/dashboard") ||
    path === "/dashboard" ||
    path.startsWith("/dashboard") ||
    hash === "#requester-dashboard" ||
    hash === "#dashboard"
  ) {
    return "requester-dashboard";
  }
  if (path.includes("/tickets") || hash === "#my-tickets") {
    return "my-tickets";
  }
  return null;
}

function getRoleRedirect(tab: string, role?: string): { targetTab: string; redirectPath: string } | null {
  const isStaffOrAdmin = role === "IT_STAFF" || role === "ADMINISTRATOR";
  const isRequester = role === "REQUESTER";

  // Requesters can only access requester views
  if (isRequester) {
    if (tab === "staff-dashboard" || tab === "ticket-queue" || tab === "user-management") {
      return { targetTab: "requester-dashboard", redirectPath: "/requester/dashboard" };
    }
  }

  // Staff and Admins cannot access requester views
  if (isStaffOrAdmin) {
    if (tab === "my-tickets" || tab === "requester-dashboard") {
      return { targetTab: "staff-dashboard", redirectPath: "/staff/dashboard" };
    }
  }

  // Non-admin IT staff cannot access user management
  if (role === "IT_STAFF" && tab === "user-management") {
    return { targetTab: "staff-dashboard", redirectPath: "/staff/dashboard" };
  }

  return null;
}

function MainContent() {
  const { user, isLoading } = useAuth();
  const userRef = useRef(user);
  const prevUserRef = useRef<{ id?: string; role?: string }>({});

  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const urlTab = getTabFromUrl();
    return urlTab || "my-tickets";
  });
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [queueFilters, setQueueFilters] = useState<QueueInitialFilters | undefined>(undefined);
  const [requesterStatusFilter, setRequesterStatusFilter] = useState<string | undefined>(() => getQueryParamsFromUrl().status);
  const [requesterResolvedRange, setRequesterResolvedRange] = useState<string | undefined>(() => getQueryParamsFromUrl().resolvedRange);
  const [showVoluntaryPasswordModal, setShowVoluntaryPasswordModal] = useState<boolean>(false);

  useEffect(() => {
    const onLocationChange = () => {
      const urlTab = getTabFromUrl();
      const currentUser = userRef.current;
      if (urlTab) {
        const redirect = getRoleRedirect(urlTab, currentUser?.role);
        if (redirect) {
          setActiveTab(redirect.targetTab);
          if (typeof window !== "undefined" && window.history && window.history.replaceState) {
            window.history.replaceState(null, "", redirect.redirectPath);
          }
        } else {
          setActiveTab(urlTab);
        }
      }
      const q = getQueryParamsFromUrl();
      setRequesterStatusFilter(q.status);
      setRequesterResolvedRange(q.resolvedRange);
    };
    window.addEventListener("popstate", onLocationChange);
    window.addEventListener("hashchange", onLocationChange);
    return () => {
      window.removeEventListener("popstate", onLocationChange);
      window.removeEventListener("hashchange", onLocationChange);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const isNewLoginOrRoleChange =
        prevUserRef.current.id !== user.id || prevUserRef.current.role !== user.role;
      prevUserRef.current = { id: user.id, role: user.role };

      if (!isNewLoginOrRoleChange) {
        return;
      }

      const isStaffOrAdmin = user.role === "IT_STAFF" || user.role === "ADMINISTRATOR";
      let urlTab = getTabFromUrl();

      // For staff/admin, treat "my-tickets" like null so they land on staff-dashboard
      if (isStaffOrAdmin && urlTab === "my-tickets") {
        urlTab = null;
      }

      if (!urlTab) {
        if (isStaffOrAdmin) {
          setActiveTab("staff-dashboard");
          if (typeof window !== "undefined" && window.history && window.history.replaceState) {
            window.history.replaceState(null, "", "/staff/dashboard");
          }
        }
      } else {
        const redirect = getRoleRedirect(urlTab, user.role);
        if (redirect) {
          setActiveTab(redirect.targetTab);
          if (typeof window !== "undefined" && window.history && window.history.replaceState) {
            window.history.replaceState(null, "", redirect.redirectPath);
          }
        } else {
          setActiveTab(urlTab);
        }
      }
    } else {
      prevUserRef.current = {};
    }
  }, [user]);

  const handleDrillDownToQueue = (filters?: QueueInitialFilters) => {
    setQueueFilters(filters);
    setSelectedTicketId(null);
    setActiveTab("ticket-queue");
    if (typeof window !== "undefined" && window.history && window.history.pushState) {
      window.history.pushState(null, "", "/staff/tickets");
    }
  };

  // Health check baseline state (for Lab 1 compliance)
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleCheck() {
    setState("loading");
    setErrorMessage("");
    try {
      const result = await checkSystem();
      if (result.online) {
        setCategories(result.categories);
        setState("success");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to connect to TokTickIT API");
      setState("error");
    }
  }

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab("ticket-detail");
  };

  const handleBackToMyTickets = () => {
    setSelectedTicketId(null);
    setRequesterStatusFilter(undefined);
    setRequesterResolvedRange(undefined);
    setActiveTab("my-tickets");
    if (typeof window !== "undefined" && window.history && window.history.pushState) {
      window.history.pushState(null, "", "/tickets");
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: "#F5F7F6" }}
        data-testid="loading-spinner"
      >
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading TokTickIT...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isMandatoryPasswordChange = user.mustChangePassword;
  const isChangingPassword = isMandatoryPasswordChange || showVoluntaryPasswordModal;

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#F5F7F6" }}>
      <Header
        activeTab={activeTab === "ticket-detail" ? "my-tickets" : activeTab}
        onTabChange={(tab) => {
          setSelectedTicketId(null);
          setRequesterStatusFilter(undefined);
          setRequesterResolvedRange(undefined);
          if (tab === "ticket-queue") {
            setQueueFilters(undefined);
          }
          setActiveTab(tab);
          if (typeof window !== "undefined" && window.history && window.history.pushState) {
            if (tab === "requester-dashboard") {
              window.history.pushState(null, "", "/requester/dashboard");
            } else if (tab === "staff-dashboard") {
              window.history.pushState(null, "", "/staff/dashboard");
            } else if (tab === "my-tickets") {
              window.history.pushState(null, "", "/tickets");
            } else if (tab === "ticket-queue") {
              window.history.pushState(null, "", "/staff/tickets");
            } else if (tab === "user-management") {
              window.history.pushState(null, "", "/admin/users");
            }
          }
        }}
        onChangePasswordClick={() => setShowVoluntaryPasswordModal(true)}
      />

      {isChangingPassword && (
        <ChangePasswordModal onClose={() => setShowVoluntaryPasswordModal(false)} />
      )}

      <main>
        {activeTab === "ticket-detail" && selectedTicketId ? (
          <RequesterTicketDetail ticketId={selectedTicketId} onBack={handleBackToMyTickets} />
        ) : activeTab === "staff-dashboard" ? (
          <StaffDashboard
            onNavigateToQueue={handleDrillDownToQueue}
            onSelectTicket={handleSelectTicket}
            onCreateTicket={() => {
              setSelectedTicketId(null);
              setActiveTab("create-ticket");
            }}
          />
        ) : activeTab === "requester-dashboard" ? (
          <RequesterDashboard
            onNavigateToTickets={(status, resolvedRange) => {
              setSelectedTicketId(null);
              setRequesterStatusFilter(status);
              setRequesterResolvedRange(resolvedRange);
              setActiveTab("my-tickets");
              if (typeof window !== "undefined" && window.history && window.history.pushState) {
                const params = new URLSearchParams();
                if (status) params.append("status", status);
                if (resolvedRange) params.append("resolvedRange", resolvedRange);
                const query = params.toString();
                window.history.pushState(null, "", `/tickets${query ? `?${query}` : ""}`);
              }
            }}
            onSelectTicket={handleSelectTicket}
            onCreateTicket={() => {
              setSelectedTicketId(null);
              setActiveTab("create-ticket");
            }}
          />
        ) : activeTab === "create-ticket" ? (
          <CreateTicket onSuccess={handleBackToMyTickets} onCancel={handleBackToMyTickets} />
        ) : activeTab === "user-management" ? (
          <UserManagement />
        ) : activeTab === "ticket-queue" ? (
          <StaffTicketQueue onSelectTicket={handleSelectTicket} initialFilters={queueFilters} />
        ) : (
          <>
            <MyTickets
              key={`my-tickets-${requesterStatusFilter || "all"}-${requesterResolvedRange || "all"}`}
              onCreateTicketClick={() => {
                setSelectedTicketId(null);
                setActiveTab("create-ticket");
              }}
              onSelectTicket={handleSelectTicket}
              initialStatusFilter={requesterStatusFilter}
              initialResolvedRange={requesterResolvedRange}
            />

            {/* Baseline Health Check Section for Lab 1 Assertions */}
            <div className="container pb-5" style={{ maxWidth: 640 }}>
              <div className="card shadow-sm border-0 p-4">
                <h2 className="h5 mb-3">
                  TokTickIT <span className="text-success">IT Service Desk Health</span>
                </h2>

                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={handleCheck}
                  disabled={state === "loading"}
                >
                  {state === "loading" ? "Loading…" : "Check System"}
                </button>

                {state === "success" && (
                  <div className="alert alert-success mt-3" role="status">
                    <div>
                      <strong>System Status:</strong> Online
                    </div>
                    {categories.length > 0 && (
                      <>
                        <div className="mt-2">
                          <strong>Supported Request Categories:</strong>
                        </div>
                        <ul className="mt-1 mb-0">
                          {categories.map((cat) => (
                            <li key={cat.id}>{cat.name}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}

                {state === "error" && (
                  <div className="alert alert-danger mt-3" role="alert">
                    <div>
                      <strong>System Status:</strong> Offline
                    </div>
                    <div>{errorMessage || "Unable to connect to TokTickIT API"}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}