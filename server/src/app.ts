import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./utils/ticketNumber.js";
import { RequestedPriority, ITPriority, TicketStatus, Role } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { sessionStore } from "./services/sessionStore.js";

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

// Helper to resolve authenticated user strictly from active session
async function resolveAuthUser(req: Request) {
  const token = sessionStore.extractToken(req);
  if (!token) return null;

  const session = sessionStore.getSession(token);
  if (!session) return null;

  const user = await getPrisma().user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) return null;

  return user;
}

// Permitted Ticket Status Transitions Matrix (BR-14)
const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.WAITING_FOR_REQUESTER]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  [TicketStatus.REOPENED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
  [TicketStatus.CLOSED]: [],
  [TicketStatus.CANCELLED]: [],
};

function isValidStatusTransition(currentStatus: TicketStatus, targetStatus: TicketStatus): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = PERMITTED_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

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
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || "10", 10)));
    const search = ((req.query.search as string) || "").trim();
    const categoryId = req.query.categoryId as string;
    const status = req.query.status as string;
    const relatedSystemId = req.query.relatedSystemId as string;
    const sortBy = (req.query.sortBy as string) === "requestedPriority" ? "requestedPriority" : "createdAt";
    const order = (req.query.order as string) === "asc" ? "asc" : "desc";

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

// Update Ticket Status (PATCH /api/tickets/:id/status)
app.patch("/api/tickets/:id/status", async (req: Request, res: Response) => {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { status, comment } = req.body || {};

    const ticket = await getPrisma().ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (authUser.role === Role.REQUESTER) {
      if (ticket.requesterId !== authUser.id) {
        return res.status(403).json({ error: "Access denied to unowned ticket" });
      }

      // BR-05: Requesters cannot directly set status to RESOLVED or CLOSED
      if (status === "RESOLVED" || status === "CLOSED") {
        return res.status(403).json({ error: "Requesters cannot set ticket status to RESOLVED or CLOSED" });
      }

      // AC-09: Problem Appears Resolved action updates status to WAITING_FOR_REQUESTER
      if (status === "WAITING_FOR_REQUESTER") {
        const activeStates = [TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER];
        if (!activeStates.includes(ticket.currentStatus)) {
          return res.status(400).json({ error: "Cannot request resolution on closed, resolved, or cancelled tickets" });
        }

        const updated = await getPrisma().ticket.update({
          where: { id },
          data: { currentStatus: TicketStatus.WAITING_FOR_REQUESTER },
        });

        if (comment && typeof comment === "string" && comment.trim()) {
          await getPrisma().publicComment.create({
            data: {
              ticketId: id,
              authorId: authUser.id,
              content: comment.trim(),
            },
          });
        }

        return res.status(200).json({
          message: "Ticket status updated",
          ticketId: updated.id,
          currentStatus: updated.currentStatus,
        });
      }

      return res.status(400).json({ error: "Invalid status transition for Requester" });
    }

    // IT Staff / Admin workflow transitions (BR-14 validation)
    if (status && Object.values(TicketStatus).includes(status as TicketStatus)) {
      const targetStatus = status as TicketStatus;
      if (!isValidStatusTransition(ticket.currentStatus, targetStatus)) {
        return res.status(400).json({ error: "Invalid status transition" });
      }

      const updated = await getPrisma().ticket.update({
        where: { id },
        data: { currentStatus: targetStatus },
      });

      return res.status(200).json({
        message: "Ticket status updated",
        ticketId: updated.id,
        currentStatus: updated.currentStatus,
      });
    }

    return res.status(400).json({ error: "Invalid status transition" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
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