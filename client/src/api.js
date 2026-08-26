const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export async function checkSystem() {
    let healthRes;
    try {
        healthRes = await fetch(`${API_URL}/api/health`);
    }
    catch {
        throw new Error("Unable to connect to TokTickIT API");
    }
    if (!healthRes.ok) {
        throw new Error("Unable to connect to TokTickIT API");
    }
    let categoriesRes;
    try {
        categoriesRes = await fetch(`${API_URL}/api/categories`);
    }
    catch {
        throw new Error("Unable to connect to TokTickIT API");
    }
    if (!categoriesRes.ok) {
        throw new Error("Unable to connect to TokTickIT API");
    }
    const categories = await categoriesRes.json();
    return { online: true, categories };
}
export async function fetchCategories() {
    const res = await fetch(`${API_URL}/api/categories`);
    if (!res.ok)
        throw new Error("Failed to fetch categories");
    return res.json();
}
export async function fetchRequesters() {
    const res = await fetch(`${API_URL}/api/requesters`);
    if (!res.ok)
        throw new Error("Failed to fetch requesters");
    return res.json();
}
export async function fetchRelatedSystems() {
    const res = await fetch(`${API_URL}/api/related-systems`);
    if (!res.ok)
        throw new Error("Failed to fetch related systems");
    return res.json();
}
export async function createTicket(payload, requesterId) {
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
export async function fetchMyTickets(params, requesterId) {
    const query = new URLSearchParams();
    if (params.page)
        query.append("page", params.page.toString());
    if (params.limit)
        query.append("limit", params.limit.toString());
    if (params.search)
        query.append("search", params.search);
    if (params.categoryId)
        query.append("categoryId", params.categoryId);
    if (params.status)
        query.append("status", params.status);
    if (params.relatedSystemId)
        query.append("relatedSystemId", params.relatedSystemId);
    if (params.sortBy)
        query.append("sortBy", params.sortBy);
    if (params.order)
        query.append("order", params.order);
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
export async function fetchTicketDetail(id, requesterId) {
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
