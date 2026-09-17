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

export type UserRole = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface RequesterUser {
  id: string;
  name: string;
  email: string;
}

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_FOR_REQUESTER" | "RESOLVED" | "CLOSED" | "REOPENED" | "CANCELLED";

export interface Ticket {
  id: string;
  ticketNumber: string;
  summary: string;
  description?: string | null;
  categoryId: string;
  categoryName: string;
  category?: { id: string; name: string };
  relatedSystemId: string;
  relatedSystemName: string;
  relatedSystem?: { id: string; name: string };
  requestedPriority: Priority;
  itPriority: Priority;
  currentStatus: TicketStatus;
  requesterId?: string;
  requester?: { id: string; name: string; email: string } | null;
  ownerId?: string | null;
  owner?: { id: string; name: string; email: string } | null;
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

export interface TicketListParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  category?: string;
  status?: string;
  priority?: string;
  itPriority?: string;
  owner?: string;
  ownerId?: string;
  relatedSystemId?: string;
  system?: string;
  sortBy?: string;
  order?: string;
  sortOrder?: string;
}

export interface TicketListResponse {
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    pageSize?: number;
    totalItems: number;
    totalCount?: number;
    totalPages: number;
  };
}

export interface AttachmentMetadata {
  id: string;
  ticketId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  deletedAt?: string | null;
  removalReason?: string | null;
}

export interface PublicComment {
  id: string;
  ticketId?: string;
  content: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
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
    healthRes = await fetch(`${API_URL}/api/health`, { credentials: "include" });
  } catch {
    throw new Error("Unable to connect to TokTickIT API");
  }

  if (!healthRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  let categoriesRes: Response;
  try {
    categoriesRes = await fetch(`${API_URL}/api/categories`, { credentials: "include" });
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
  const res = await fetch(`${API_URL}/api/categories`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch requesters");
  return res.json();
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch related systems");
  return res.json();
}

export async function createTicket(
  payload: CreateTicketPayload,
  requesterId?: string
): Promise<Ticket> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (requesterId) headers["X-Requester-Id"] = requesterId;

  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    const errorMsg = json?.details?.[0] || json?.error || "Failed to create ticket";
    throw new Error(errorMsg);
  }

  return json;
}

export async function fetchTickets(
  params: TicketListParams = {},
  requesterId?: string
): Promise<TicketListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  const limitVal = params.pageSize || params.limit;
  if (limitVal) query.append("pageSize", limitVal.toString());
  if (params.search) query.append("search", params.search);
  const catVal = params.categoryId || params.category;
  if (catVal) query.append("category", catVal);
  if (params.status) query.append("status", params.status);
  const prioVal = params.priority || params.itPriority;
  if (prioVal) query.append("priority", prioVal);
  const ownerVal = params.owner || params.ownerId;
  if (ownerVal) query.append("owner", ownerVal);
  const sysVal = params.relatedSystemId || params.system;
  if (sysVal) query.append("system", sysVal);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  const sortOrderVal = params.sortOrder || params.order;
  if (sortOrderVal) query.append("sortOrder", sortOrderVal);

  const headers: Record<string, string> = {};
  if (requesterId) headers["X-Requester-Id"] = requesterId;

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`, {
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return res.json();
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
  requesterId?: string
): Promise<TicketListResponse> {
  return fetchTickets(params, requesterId);
}

export async function fetchTicketDetail(id: string, requesterId?: string): Promise<TicketDetail> {
  const headers: Record<string, string> = {};
  if (requesterId) headers["X-Requester-Id"] = requesterId;

  const res = await fetch(`${API_URL}/api/tickets/${id}`, {
    headers,
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Ticket not found or access denied");
  }

  return json;
}

export async function fetchPublicComments(ticketId: string): Promise<PublicComment[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    credentials: "include",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error || "Failed to fetch comments");
  }
  return res.json();
}

export async function postPublicComment(ticketId: string, content: string): Promise<PublicComment> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to post comment");
  return json;
}

export async function updateRequesterTicketStatus(
  ticketId: string,
  status: string,
  comment?: string
): Promise<{ message: string; ticketId: string; currentStatus: TicketStatus }> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status, comment }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to update status");
  return json;
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  comment?: string
): Promise<{ message: string; ticketId: string; currentStatus: TicketStatus }> {
  return updateRequesterTicketStatus(ticketId, status, comment);
}

export async function claimOrReassignOwner(
  ticketId: string,
  ownerId?: string | null
): Promise<{ message: string; ticketId: string; owner: { id: string; name: string; email: string } | null }> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/owner`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ownerId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to update ticket ownership");
  return json;
}

export async function updateItPriority(
  ticketId: string,
  itPriority: Priority
): Promise<{ message: string; ticketId: string; itPriority: Priority }> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ itPriority }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to update IT Priority");
  return json;
}

export async function uploadAttachment(
  ticketId: string,
  file: File,
  requesterId?: string
): Promise<AttachmentMetadata> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (requesterId) headers["X-Requester-Id"] = requesterId;

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Failed to upload attachment");
  }

  return json;
}

export async function getAttachmentMetadata(
  id: string,
  requesterId?: string
): Promise<AttachmentMetadata> {
  const headers: Record<string, string> = {};
  if (requesterId) headers["X-Requester-Id"] = requesterId;

  const res = await fetch(`${API_URL}/api/attachments/${id}/metadata`, {
    headers,
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Failed to fetch attachment metadata");
  }

  return json;
}

export async function downloadAttachment(
  id: string,
  fileName: string,
  requesterId?: string
): Promise<void> {
  const headers: Record<string, string> = {};
  if (requesterId) headers["X-Requester-Id"] = requesterId;

  const res = await fetch(`${API_URL}/api/attachments/${id}/download`, {
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error || "Attachment cannot be downloaded");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function softRemoveAttachment(
  id: string,
  removalReason: string,
  requesterId?: string
): Promise<AttachmentMetadata> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (requesterId) headers["X-Requester-Id"] = requesterId;

  const res = await fetch(`${API_URL}/api/attachments/${id}`, {
    method: "DELETE",
    headers,
    credentials: "include",
    body: JSON.stringify({ removalReason }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Failed to soft-remove attachment");
  }

  return json;
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();
  if (!res.ok) {
    const errorMsg = json?.error?.message || json?.error || "Invalid email or password. Please try again.";
    throw new Error(typeof errorMsg === "string" ? errorMsg : "Invalid email or password. Please try again.");
  }

  return json.user;
}

export async function logoutUser(): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to logout");
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    });

    if (res.ok) {
      const json = await res.json();
      return json.user || null;
    }
  } catch {
    // ignore
  }

  const activeReq = typeof localStorage !== "undefined" ? localStorage.getItem("toktickit_active_requester") : null;
  if (activeReq) {
    try {
      const parsed = JSON.parse(activeReq);
      return {
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
        role: "REQUESTER",
        mustChangePassword: false,
      };
    } catch {
      // ignore
    }
  }

  return null;
}

export async function changePasswordUser(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword?: string
): Promise<{ message: string; mustChangePassword: boolean }> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
  });

  const json = await res.json();
  if (!res.ok) {
    const errorMsg = json?.error?.message || json?.error || "Failed to change password";
    throw new Error(typeof errorMsg === "string" ? errorMsg : "Failed to change password");
  }

  return json;
}