import { useState } from "react";
import { checkSystem, Category } from "./api";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import { Header } from "./components/Header";
import { RequesterSelection } from "./components/RequesterSelection";
import { CreateTicket } from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
import { TicketDetail } from "./components/TicketDetail";

type UiState = "idle" | "loading" | "success" | "error";

function MainContent() {
  const { activeRequester } = useRequester();
  const [activeTab, setActiveTab] = useState<"my-tickets" | "create-ticket" | "ticket-detail">("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

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
    setActiveTab("my-tickets");
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#F5F7F6" }}>
      <Header
        activeTab={activeTab === "ticket-detail" ? "my-tickets" : activeTab}
        onTabChange={(tab) => {
          setSelectedTicketId(null);
          setActiveTab(tab);
        }}
      />

      {!activeRequester ? (
        <RequesterSelection />
      ) : (
        <main>
          {activeTab === "ticket-detail" && selectedTicketId ? (
            <TicketDetail ticketId={selectedTicketId} onBack={handleBackToMyTickets} />
          ) : activeTab === "create-ticket" ? (
            <CreateTicket
              onSuccess={handleBackToMyTickets}
              onCancel={handleBackToMyTickets}
            />
          ) : (
            <>
              <MyTickets
                onCreateTicketClick={() => {
                  setSelectedTicketId(null);
                  setActiveTab("create-ticket");
                }}
                onSelectTicket={handleSelectTicket}
              />

              {/* Collapsible / Baseline Health Check Section for Lab 1 Assertions */}
              <div className="container pb-5" style={{ maxWidth: 640 }}>
                <div className="card shadow-sm border-0 p-4">
                  <h2 className="h5 mb-3">
                    TokTickIT <span className="text-success">IT Service Desk Health</span>
                  </h2>

                  <button className="btn btn-outline-success btn-sm" onClick={handleCheck} disabled={state === "loading"}>
                    {state === "loading" ? "Loading…" : "Check System"}
                  </button>

                  {state === "success" && (
                    <div className="alert alert-success mt-3" role="status">
                      <div><strong>System Status:</strong> Online</div>
                      {categories.length > 0 && (
                        <>
                          <div className="mt-2"><strong>Supported Request Categories:</strong></div>
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
                      <div><strong>System Status:</strong> Offline</div>
                      <div>{errorMessage || "Unable to connect to TokTickIT API"}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <MainContent />
    </RequesterProvider>
  );
}