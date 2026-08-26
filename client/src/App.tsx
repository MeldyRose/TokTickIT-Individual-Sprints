import { useState } from "react";
import { checkSystem, Category } from "./api";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import { Header } from "./components/Header";
import { RequesterSelection } from "./components/RequesterSelection";

type UiState = "idle" | "loading" | "success" | "error";

function MainContent() {
  const { activeRequester } = useRequester();
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

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#F5F7F6" }}>
      <Header />
      {!activeRequester ? (
        <RequesterSelection />
      ) : (
        <main className="container py-4" style={{ maxWidth: 640 }}>
          <div className="card shadow-sm border-0 p-4">
            <h1 className="h3 mb-4">
              TokTickIT <span className="text-success">IT Service Desk</span>
            </h1>

            <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
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
