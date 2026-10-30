import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./utils/ticketNumber.js";
import { RequestedPriority, ITPriority, TicketStatus, Role } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { adminUsersRouter } from "./routes/adminUsers.js";
import { actionsRouter } from "./routes/actions.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { resolveAuthUser } from "./utils/auth.js";
import { sessionStore } from "./services/sessionStore.js";
import { isValidStatusTransition, getPermittedNextStatuses } from "./utils/statusMatrix.js";

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/tickets/:id/actions", actionsRouter);
app.use("/api/dashboard", dashboardRouter);



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
    const requesters = await getPrisma().user.findMany({
      where: { isActive: true, role: Role.REQUESTER },
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

// Create Ticket
app.post("/api/tickets", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const requesterId = authUser.id;
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

    const reqPriorityEnum = (requestedPriority && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(requestedPriority))
      ? (requestedPriority as RequestedPriority)
      : RequestedPriority.MEDIUM;
    const itPriorityEnum = reqPriorityEnum as unknown as ITPriority;

    const ticketNumber = generateTicketNumber();

    const ticket = await getPrisma().ticket.create({
      data: {
        ticketNumber,
        summary: summary.trim(),
        description: description ? description.trim() : "",
        categoryId,
        relatedSystemId,
        requestedPriority: reqPriorityEnum,
        itPriority: itPriorityEnum,
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

// List Tickets
app.get("/api/tickets", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const pageSizeParam = (req.query.pageSize || req.query.limit) as string;
    const limit = Math.min(50, Math.max(1, parseInt(pageSizeParam || "10", 10)));
    const search = ((req.query.search as string) || "").trim();
    const categoryId = (req.query.categoryId || req.query.category) as string;
    const status = req.query.status as string;
    const relatedSystemId = (req.query.relatedSystemId || req.query.system) as string;
    const priority = (req.query.priority || req.query.itPriority) as string;
    const owner = (req.query.owner || req.query.ownerId) as string;

    const rawSortBy = (req.query.sortBy as string) || "createdAt";
    let sortBy = "createdAt";
    if (rawSortBy === "requestedPriority" || rawSortBy === "itPriority" || rawSortBy === "currentStatus") {
      sortBy = rawSortBy;
    }
    const orderParam = (req.query.sortOrder || req.query.order) as string;
    const order = orderParam === "asc" ? "asc" : "desc";

    const where: any = {};
    if (authUser.role === Role.REQUESTER) {
      where.requesterId = authUser.id;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (relatedSystemId) {
      where.relatedSystemId = relatedSystemId;
    }

    if (status && ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"].includes(status)) {
      where.currentStatus = status as TicketStatus;
    }

    if (priority && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
      where.itPriority = priority;
    }

    if (owner) {
      if (owner === "unassigned") {
        where.ownerId = null;
      } else if (owner === "me") {
        where.ownerId = authUser.id;
      } else {
        where.ownerId = owner;
      }
    }

    if (search) {
      where.OR = [
        { summary: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { ticketNumber: { contains: search, mode: "insensitive" } },
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
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
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
      category: t.category,
      relatedSystemId: t.relatedSystemId,
      relatedSystemName: t.relatedSystem.name,
      relatedSystem: t.relatedSystem,
      requestedPriority: t.requestedPriority,
      itPriority: t.itPriority,
      currentStatus: t.currentStatus,
      requesterId: t.requesterId,
      requester: t.requester,
      ownerId: t.ownerId,
      owner: t.owner,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      attachmentCount: t._count.attachments,
    }));

    res.status(200).json({
      data,
      pagination: {
        page,
        limit,
        pageSize: limit,
        totalItems,
        totalCount: totalItems,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// Single Ticket Detail View
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const ticket = await getPrisma().ticket.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, description: true } },
        relatedSystem: { select: { id: true, name: true, description: true } },
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        attachments: {
          orderBy: { uploadedAt: "asc" },
          select: {
            id: true,
            ticketId: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true,
            deletedAt: true,
            removalReason: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found or access denied" });
    }

    if (authUser.role === Role.REQUESTER && ticket.requesterId !== authUser.id) {
      return res.status(404).json({ error: "Ticket not found or access denied" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ticket details" });
  }
});

// Claim or Reassign Ticket Ownership (PATCH /api/tickets/:id/owner)
app.patch("/api/tickets/:id/owner", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (authUser.role === Role.REQUESTER) {
      return res.status(403).json({ error: "Forbidden: Ticket ownership controls are restricted to IT Staff and Administrators" });
    }

    const { id } = req.params;
    const ticket = await getPrisma().ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const { ownerId } = req.body || {};
    let targetOwnerId: string | null = null;

    if (ownerId === undefined || ownerId === authUser.id) {
      // Claim ticket as self
      targetOwnerId = authUser.id;
    } else if (ownerId === null) {
      // Unassign ticket
      targetOwnerId = null;
    } else if (typeof ownerId === "string") {
      // Validate target user exists, is active, and is IT_STAFF or ADMINISTRATOR
      const targetUser = await getPrisma().user.findUnique({ where: { id: ownerId } });
      if (!targetUser || !targetUser.isActive || (targetUser.role !== Role.IT_STAFF && targetUser.role !== Role.ADMINISTRATOR)) {
        return res.status(400).json({ error: "Invalid owner: Target user must be an active IT Staff or Administrator" });
      }
      targetOwnerId = targetUser.id;
    } else {
      return res.status(400).json({ error: "Invalid ownerId format" });
    }

    const updated = await getPrisma().ticket.update({
      where: { id },
      data: { ownerId: targetOwnerId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      message: "Ticket ownership updated",
      ticketId: updated.id,
      owner: updated.owner,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update ticket ownership" });
  }
});

// Update IT Priority (PATCH /api/tickets/:id/priority)
app.patch("/api/tickets/:id/priority", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (authUser.role === Role.REQUESTER) {
      return res.status(403).json({ error: "Forbidden: IT Priority controls are restricted to IT Staff and Administrators" });
    }

    const { id } = req.params;
    const ticket = await getPrisma().ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const { itPriority } = req.body || {};
    if (!itPriority || !["LOW", "MEDIUM", "HIGH", "URGENT"].includes(itPriority)) {
      return res.status(400).json({ error: "Invalid IT Priority value. Must be LOW, MEDIUM, HIGH, or URGENT." });
    }

    const updated = await getPrisma().ticket.update({
      where: { id },
      data: { itPriority: itPriority as ITPriority },
    });

    return res.status(200).json({
      message: "IT Priority updated",
      ticketId: updated.id,
      itPriority: updated.itPriority,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update IT Priority" });
  }
});

// Update Ticket Status (PATCH /api/tickets/:id/status)
app.patch("/api/tickets/:id/status", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
      });
    }

    const { id } = req.params;
    const { status, comment, resolutionSummary, expectedUpdatedAt: bodyExpectedUpdatedAt } = req.body || {};
    const expectedUpdatedAt = bodyExpectedUpdatedAt || req.headers["x-expected-updated-at"];

    const ticket = await getPrisma().ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    if (authUser.role === Role.REQUESTER) {
      if (ticket.requesterId !== authUser.id) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Access denied to unowned ticket",
          },
        });
      }

      // Requesters cannot directly set status to RESOLVED or CLOSED
      if (status === "RESOLVED" || status === "CLOSED") {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Requesters cannot set ticket status to RESOLVED or CLOSED",
          },
        });
      }

      // Requesters can only signal resolution via WAITING_FOR_REQUESTER
      if (status !== "WAITING_FOR_REQUESTER") {
        return res.status(400).json({
          error: {
            code: "INVALID_INPUT",
            message: "Invalid status transition for Requester",
          },
        });
      }

      const activeStates: TicketStatus[] = [
        TicketStatus.NEW,
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
        TicketStatus.WAITING_FOR_REQUESTER,
      ];
      if (!activeStates.includes(ticket.currentStatus)) {
        return res.status(400).json({
          error: {
            code: "INVALID_INPUT",
            message: "Cannot request resolution on closed, resolved, or cancelled tickets",
          },
        });
      }

      // Same-status transition: reject unchanged status with 400 (Point 1)
      if (ticket.currentStatus === TicketStatus.WAITING_FOR_REQUESTER) {
        return res.status(400).json({
          error: {
            code: "INVALID_INPUT",
            message: "Status is already WAITING_FOR_REQUESTER",
          },
        });
      }
    } else {
      // IT Staff / Admin workflow transitions
      if (!status || !Object.values(TicketStatus).includes(status as TicketStatus)) {
        return res.status(400).json({
          error: {
            code: "INVALID_INPUT",
            message: "Invalid status transition",
          },
        });
      }

      const targetStatus = status as TicketStatus;

      // Reject same-status unchanged transition with 400 (Point 1)
      if (targetStatus === ticket.currentStatus) {
        return res.status(400).json({
          error: {
            code: "INVALID_INPUT",
            message: `Status is already ${ticket.currentStatus}. Unchanged status transitions are not permitted.`,
          },
        });
      }

      if (!isValidStatusTransition(ticket.currentStatus, targetStatus)) {
        return res.status(400).json({
          error: {
            code: "INVALID_INPUT",
            message: `Invalid status transition: Cannot transition from ${ticket.currentStatus} to ${targetStatus}`,
          },
          currentStatus: ticket.currentStatus,
          targetStatus,
          permittedTransitions: getPermittedNextStatuses(ticket.currentStatus),
        });
      }

      // Resolution Gate Enforcement
      if (targetStatus === TicketStatus.RESOLVED) {
        const actionCount = await getPrisma().actionTaken.count({
          where: { ticketId: id },
        });

        const details: Array<{ criterion: string; message: string }> = [];

        if (actionCount === 0) {
          details.push({
            criterion: "MISSING_ACTION_TAKEN",
            message: "At least one Action Taken must be logged before resolving this ticket.",
          });
        }

        if (!resolutionSummary || typeof resolutionSummary !== "string" || resolutionSummary.trim().length < 10) {
          details.push({
            criterion: "MISSING_RESOLUTION_SUMMARY",
            message: "A resolution summary of at least 10 characters is required.",
          });
        } else if (resolutionSummary.trim().length > 2000) {
          details.push({
            criterion: "INVALID_RESOLUTION_SUMMARY",
            message: "Resolution summary must not exceed 2000 characters.",
          });
        }

        if (details.length > 0) {
          return res.status(422).json({
            error: {
              code: "RESOLUTION_GATE_FAILED",
              message: "Ticket cannot be resolved until all resolution prerequisites are satisfied.",
              details,
            },
          });
        }
      }

      if (targetStatus === TicketStatus.CLOSED) {
        const actionCount = await getPrisma().actionTaken.count({
          where: { ticketId: id },
        });
        if (actionCount === 0) {
          return res.status(422).json({
            error: {
              code: "RESOLUTION_GATE_FAILED",
              message: "Ticket cannot be closed until all resolution prerequisites are satisfied.",
              details: [
                {
                  criterion: "MISSING_ACTION_TAKEN",
                  message: "At least one Action Taken must be logged before closing this ticket.",
                },
              ],
            },
          });
        }
      }
    }

    // OCC: expectedUpdatedAt must be supplied and be a valid ISO date string (BR-16)
    // Placed strictly after role and ownership checks (Point 3)
    if (
      !expectedUpdatedAt ||
      typeof expectedUpdatedAt !== "string" ||
      isNaN(new Date(expectedUpdatedAt).getTime())
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: "expectedUpdatedAt is required and must be a valid ISO date string for optimistic concurrency control.",
        },
      });
    }

    const targetStatus = status as TicketStatus;

    const dataToUpdate: any = {
      currentStatus: targetStatus,
    };

    if (targetStatus === TicketStatus.RESOLVED) {
      dataToUpdate.resolvedAt = new Date();
      dataToUpdate.resolutionSummary = (resolutionSummary as string).trim();
    } else if (targetStatus === TicketStatus.CLOSED) {
      dataToUpdate.closedAt = new Date();
    } else if (targetStatus === TicketStatus.REOPENED) {
      dataToUpdate.resolvedAt = null;
      dataToUpdate.closedAt = null;
    }

    const expectedDate = new Date(expectedUpdatedAt);

    // Atomic conditional update using updateMany where updatedAt matches exactly (Point 2)
    // Wrapped in a transaction with comment creation (Nit)
    const result = await getPrisma().$transaction(async (tx) => {
      const updateResult = await tx.ticket.updateMany({
        where: {
          id,
          updatedAt: expectedDate,
        },
        data: dataToUpdate,
      });

      if (updateResult.count === 0) {
        return null;
      }

      if (comment && typeof comment === "string" && comment.trim()) {
        await tx.publicComment.create({
          data: {
            ticketId: id,
            authorId: authUser.id,
            content: comment.trim(),
          },
        });
      }

      return tx.ticket.findUnique({
        where: { id },
      });
    });

    if (!result) {
      const latestTicket = await getPrisma().ticket.findUnique({ where: { id } });
      return res.status(409).json({
        error: {
          code: "STALE_UPDATE",
          message: "Ticket has been modified by another user. Please reload latest changes.",
          currentUpdatedAt: latestTicket?.updatedAt.toISOString(),
        },
      });
    }

    return res.status(200).json({
      message: "Ticket status updated",
      ticketId: result.id,
      id: result.id,
      ticketNumber: result.ticketNumber,
      currentStatus: result.currentStatus,
      resolvedAt: result.resolvedAt,
      closedAt: result.closedAt,
      resolutionSummary: result.resolutionSummary,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update status",
      },
    });
  }
});

// GET /api/tickets/:id/comments
app.get("/api/tickets/:id/comments", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const ticket = await getPrisma().ticket.findUnique({
      where: { id },
      select: { requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (authUser.role === Role.REQUESTER && ticket.requesterId !== authUser.id) {
      return res.status(403).json({ error: "Access denied to unowned ticket comments" });
    }

    const comments = await getPrisma().publicComment.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/tickets/:id/comments
app.post("/api/tickets/:id/comments", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { content } = req.body || {};

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({ error: "Comment content must be 2,000 characters or less" });
    }

    const ticket = await getPrisma().ticket.findUnique({
      where: { id },
      select: { requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (authUser.role === Role.REQUESTER && ticket.requesterId !== authUser.id) {
      return res.status(403).json({ error: "Access denied to unowned ticket comments" });
    }

    const comment = await getPrisma().publicComment.create({
      data: {
        ticketId: id,
        authorId: authUser.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// GET /api/tickets/:id/notes (AC-04: 403 Forbidden for Requesters)
app.get("/api/tickets/:id/notes", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (authUser.role === Role.REQUESTER) {
      return res.status(403).json({ error: "Forbidden: Internal notes restricted to IT Staff and Administrators" });
    }

    const { id } = req.params;
    const ticket = await getPrisma().ticket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const notes = await getPrisma().internalNote.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// POST /api/tickets/:id/notes (AC-04: 403 Forbidden for Requesters)
app.post("/api/tickets/:id/notes", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (authUser.role === Role.REQUESTER) {
      return res.status(403).json({ error: "Forbidden: Internal notes restricted to IT Staff and Administrators" });
    }

    const { id } = req.params;
    const { content } = req.body || {};

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Note content cannot be empty" });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({ error: "Note content must be 2,000 characters or less" });
    }

    const ticket = await getPrisma().ticket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const note = await getPrisma().internalNote.create({
      data: {
        ticketId: id,
        authorId: authUser.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: "Failed to post note" });
  }
});

// Attachment Upload Endpoint
app.post("/api/tickets/:id/attachments", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: ticketId } = req.params;
    const ticket = await getPrisma().ticket.findUnique({
      where: { id: ticketId },
      select: { requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found or access denied" });
    }

    if (authUser.role === Role.REQUESTER && ticket.requesterId !== authUser.id) {
      return res.status(404).json({ error: "Ticket not found or access denied" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "File type not permitted or file size exceeds 5MB limit" });
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "File type not permitted or file size exceeds 5MB limit" });
    }

    const activeCount = await getPrisma().attachment.count({
      where: {
        ticketId,
        deletedAt: null,
      },
    });

    if (activeCount >= 5) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Maximum active attachments limit (5) reached for this ticket" });
    }

    const attachment = await getPrisma().attachment.create({
      data: {
        ticketId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        filePath: file.path,
      },
    });

    res.status(201).json({
      id: attachment.id,
      ticketId: attachment.ticketId,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      uploadedAt: attachment.uploadedAt,
      deletedAt: attachment.deletedAt,
      removalReason: attachment.removalReason,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

// Attachment Metadata Endpoint
app.get("/api/attachments/:id/metadata", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const attachment = await getPrisma().attachment.findUnique({
      where: { id },
      include: {
        ticket: { select: { requesterId: true } },
      },
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found or access denied" });
    }

    if (authUser.role === Role.REQUESTER && attachment.ticket.requesterId !== authUser.id) {
      return res.status(404).json({ error: "Attachment not found or access denied" });
    }

    res.status(200).json({
      id: attachment.id,
      ticketId: attachment.ticketId,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      uploadedAt: attachment.uploadedAt,
      deletedAt: attachment.deletedAt,
      removalReason: attachment.removalReason,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attachment metadata" });
  }
});

// Attachment Download Endpoint
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const attachment = await getPrisma().attachment.findUnique({
      where: { id },
      include: {
        ticket: { select: { requesterId: true } },
      },
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found or access denied" });
    }

    if (authUser.role === Role.REQUESTER && attachment.ticket.requesterId !== authUser.id) {
      return res.status(404).json({ error: "Attachment not found or access denied" });
    }

    if (attachment.deletedAt !== null) {
      return res.status(403).json({ error: "Attachment has been soft-removed and cannot be downloaded" });
    }

    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({ error: "File content not found on server" });
    }

    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${attachment.fileName}"`);
    return res.sendFile(path.resolve(attachment.filePath));
  } catch (error) {
    res.status(500).json({ error: "Failed to download attachment" });
  }
});

// Soft-remove Attachment Endpoint
app.delete("/api/attachments/:id", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { removalReason } = req.body || {};

    if (!removalReason || typeof removalReason !== "string" || removalReason.trim().length === 0) {
      return res.status(400).json({ error: "Removal reason is required" });
    }

    const attachment = await getPrisma().attachment.findUnique({
      where: { id },
      include: {
        ticket: { select: { requesterId: true } },
      },
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found or access denied" });
    }

    if (authUser.role === Role.REQUESTER && attachment.ticket.requesterId !== authUser.id) {
      return res.status(404).json({ error: "Attachment not found or access denied" });
    }

    const updated = await getPrisma().attachment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        removalReason: removalReason.trim(),
      },
    });

    res.status(200).json({
      id: updated.id,
      ticketId: updated.ticketId,
      fileName: updated.fileName,
      fileSize: updated.fileSize,
      mimeType: updated.mimeType,
      uploadedAt: updated.uploadedAt,
      deletedAt: updated.deletedAt,
      removalReason: updated.removalReason,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to soft-remove attachment" });
  }
});

export default app;