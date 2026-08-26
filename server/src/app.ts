import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./utils/ticketNumber.js";
import { Priority, TicketStatus } from "@prisma/client";

// getPrisma() is your lazy database handle.
// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
    const order = ["Account and Access", "Hardware", "Software", "Network"];
    categories.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().requesterUser.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
    res.status(200).json(requesters);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requesters" });
  }
});

app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });
    res.status(200).json(systems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch related systems" });
  }
});

app.post("/api/tickets", async (req: Request, res: Response) => {
  try {
    const requesterId = req.headers["x-requester-id"] as string;
    if (!requesterId) {
      return res.status(400).json({ error: "X-Requester-Id header is required" });
    }

    const { summary, description, categoryId, relatedSystemId, requestedPriority } = req.body;

    const details: string[] = [];
    if (!summary || typeof summary !== "string" || summary.trim().length === 0) {
      details.push("Summary is required");
    } else if (summary.trim().length > 255) {
      details.push("Summary must be 255 characters or less");
    }

    if (!categoryId || typeof categoryId !== "string") {
      details.push("Category is required");
    }

    if (!relatedSystemId || typeof relatedSystemId !== "string") {
      details.push("Related System is required");
    }

    if (details.length > 0) {
      return res.status(400).json({ error: "Validation failure", details });
    }

    const priorityEnum = (requestedPriority && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(requestedPriority))
      ? (requestedPriority as Priority)
      : Priority.MEDIUM;

    const ticketNumber = generateTicketNumber();

    const ticket = await getPrisma().ticket.create({
      data: {
        ticketNumber,
        summary: summary.trim(),
        description: description ? description.trim() : null,
        categoryId,
        relatedSystemId,
        requestedPriority: priorityEnum,
        itPriority: priorityEnum,
        currentStatus: TicketStatus.NEW,
        requesterId,
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

app.get("/api/tickets", async (req: Request, res: Response) => {
  try {
    const requesterId = req.headers["x-requester-id"] as string;
    if (!requesterId) {
      return res.status(400).json({ error: "X-Requester-Id header is required" });
    }

    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || "10", 10)));
    const search = ((req.query.search as string) || "").trim();
    const categoryId = req.query.categoryId as string;
    const status = req.query.status as string;
    const relatedSystemId = req.query.relatedSystemId as string;
    const sortBy = (req.query.sortBy as string) === "requestedPriority" ? "requestedPriority" : "createdAt";
    const order = (req.query.order as string) === "asc" ? "asc" : "desc";

    const where: any = {
      requesterId,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (relatedSystemId) {
      where.relatedSystemId = relatedSystemId;
    }

    if (status && ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
      where.currentStatus = status as TicketStatus;
    }

    if (search) {
      where.OR = [
        { summary: { contains: search } },
        { description: { contains: search } },
        { ticketNumber: { contains: search } },
      ];
    }

    const totalItems = await getPrisma().ticket.count({ where });
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const tickets = await getPrisma().ticket.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        _count: { select: { attachments: { where: { deletedAt: null } } } },
      },
    });

    const data = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      description: t.description,
      categoryId: t.categoryId,
      categoryName: t.category.name,
      relatedSystemId: t.relatedSystemId,
      relatedSystemName: t.relatedSystem.name,
      requestedPriority: t.requestedPriority,
      itPriority: t.itPriority,
      currentStatus: t.currentStatus,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      attachmentCount: t._count.attachments,
    }));

    res.status(200).json({
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// EP-06: Requester Ticket Detail View Endpoint (Issue 5)
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const requesterId = req.headers["x-requester-id"] as string;
    if (!requesterId) {
      return res.status(400).json({ error: "X-Requester-Id header is required" });
    }

    const { id } = req.params;
    const ticket = await getPrisma().ticket.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, description: true } },
        relatedSystem: { select: { id: true, name: true, description: true } },
        requester: { select: { id: true, name: true, email: true } },
        attachments: {
          where: { deletedAt: null },
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!ticket || ticket.requesterId !== requesterId) {
      return res.status(404).json({ error: "Ticket not found or access denied" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ticket details" });
  }
});

export default app;
