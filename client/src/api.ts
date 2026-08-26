const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface RelatedSystem {
  id: string;
  name: string;
  description?: string;
}

export interface RequesterUser {
  id: string;
  name: string;
  email: string;
}

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Ticket {
  id: string;
  ticketNumber: string;
  summary: string;
  description?: string | null;
  categoryId: string;
  categoryName: string;
  relatedSystemId: string;
  relatedSystemName: string;
  requestedPriority: Priority;
  itPriority: Priority;
  currentStatus: TicketStatus;
  createdAt: string;
  updatedAt: string;
  attachmentCount: number;
}

export interface CreateTicketPayload {
  summary: string;
  description?: string;
  categoryId: string;
  relatedSystemId: string;
  requestedPriority?: Priority;
}

export interface TicketListResponse {
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AttachmentMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface TicketDetail {
  id: string;
  ticketNumber: string;
  summary: string;
  description?: string | null;
  categoryId: string;
  category: { id: string; name: string; description?: string };
  relatedSystemId: string;
  relatedSystem: { id: string; name: string; description?: string };
  requestedPriority: Priority;
  itPriority: Priority;
  currentStatus: TicketStatus;
  requesterId: string;
  requester: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  attachments: AttachmentMetadata[];
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

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

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters`);
  if (!res.ok) throw new Error("Failed to fetch requesters");
  return res.json();
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`);
  if (!res.ok) throw new Error("Failed to fetch related systems");
  return res.json();
}

export async function createTicket(
  payload: CreateTicketPayload,
  requesterId: string
): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requester-Id": requesterId,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    const errorMsg = json?.details?.[0] || json?.error || "Failed to create ticket";
    throw new Error(errorMsg);
  }

  return json;
}

export async function fetchMyTickets(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
    relatedSystemId?: string;
    sortBy?: string;
    order?: string;
  },
  requesterId: string
): Promise<TicketListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.categoryId) query.append("categoryId", params.categoryId);
  if (params.status) query.append("status", params.status);
  if (params.relatedSystemId) query.append("relatedSystemId", params.relatedSystemId);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.order) query.append("order", params.order);

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`, {
    headers: {
      "X-Requester-Id": requesterId,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return res.json();
}

export async function fetchTicketDetail(id: string, requesterId: string): Promise<TicketDetail> {
  const res = await fetch(`${API_URL}/api/tickets/${id}`, {
    headers: {
      "X-Requester-Id": requesterId,
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Ticket not found or access denied");
  }

  return json;
}
