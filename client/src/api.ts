const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

// Call the backend to check system health and fetch request categories.
// Throwing on failure lets the UI show a single Offline/error state.
export async function checkSystem(): Promise<SystemStatus> {
  let healthRes: Response;
  try {
    healthRes = await fetch(`${API_URL}/api/health`);
  } catch {
    throw new Error("Unable to connect to TokTickIT API");
  }

  if (!healthRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  let categoriesRes: Response;
  try {
    categoriesRes = await fetch(`${API_URL}/api/categories`);
  } catch {
    throw new Error("Unable to connect to TokTickIT API");
  }

  if (!categoriesRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const categories: Category[] = await categoriesRes.json();
  return { online: true, categories };
}

export interface RequesterUser {
  id: string;
  name: string;
  email: string;
}

export async function fetchRequesters(): Promise<RequesterUser[]> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/requesters`);
  } catch {
    throw new Error("Unable to connect to TokTickIT API");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch active requesters");
  }

  return res.json();
}
