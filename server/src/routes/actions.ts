import { Router, Request, Response } from "express";
import { Role, TicketStatus } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { resolveAuthUser } from "../utils/auth.js";

export const actionsRouter = Router({ mergeParams: true });

// POST /api/tickets/:id/actions - Create Action Taken
actionsRouter.post("/", async (req: Request, res: Response) => {
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

    if (authUser.role === Role.REQUESTER) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Requesters are not permitted to create actions taken",
        },
      });
    }

    const ticketId = req.params.id || req.params.ticketId;
    const ticket = await getPrisma().ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    // Terminal tickets (CLOSED, CANCELLED) cannot accept actions
    if (ticket.currentStatus === TicketStatus.CLOSED || ticket.currentStatus === TicketStatus.CANCELLED) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: `Cannot log actions on a ticket with terminal status ${ticket.currentStatus}.`,
        },
      });
    }

    const {
      description,
      result,
      followUpRequired = false,
      followUpNote,
      attachmentNotes,
      actionDateTime,
      claimTicket = false,
    } = req.body || {};

    const validationDetails: Array<{ field: string; issue: string }> = [];

    // Validate actionDateTime if provided: must be a valid ISO date string and not in the future
    let parsedActionDateTime = new Date();
    if (actionDateTime !== undefined && actionDateTime !== null) {
      if (typeof actionDateTime !== "string" || !actionDateTime.trim() || isNaN(new Date(actionDateTime).getTime())) {
        validationDetails.push({
          field: "actionDateTime",
          issue: "Action date/time must be a valid ISO date string.",
        });
      } else {
        const dt = new Date(actionDateTime);
        // Reject future dates (allowing 5 minute clock drift)
        if (dt.getTime() > Date.now() + 5 * 60 * 1000) {
          validationDetails.push({
            field: "actionDateTime",
            issue: "Action date/time cannot be in the future.",
          });
        } else {
          parsedActionDateTime = dt;
        }
      }
    }

    // Reject non-boolean followUpRequired
    if (followUpRequired !== undefined && typeof followUpRequired !== "boolean") {
      validationDetails.push({
        field: "followUpRequired",
        issue: "followUpRequired must be a boolean (true or false).",
      });
    }

    // Validate description: mandatory string, 10 - 2000 chars
    if (!description || typeof description !== "string" || description.trim().length < 10) {
      validationDetails.push({
        field: "description",
        issue: "Description is required and must be at least 10 characters.",
      });
    } else if (description.trim().length > 2000) {
      validationDetails.push({
        field: "description",
        issue: "Description must not exceed 2000 characters.",
      });
    }

    // Validate result: mandatory string, 3 - 500 chars
    if (!result || typeof result !== "string" || result.trim().length < 3) {
      validationDetails.push({
        field: "result",
        issue: "Result is required and must be at least 3 characters.",
      });
    } else if (result.trim().length > 500) {
      validationDetails.push({
        field: "result",
        issue: "Result must not exceed 500 characters.",
      });
    }

    // Validate followUpRequired and followUpNote
    const isFollowUpRequired = Boolean(followUpRequired);
    if (isFollowUpRequired) {
      if (!followUpNote || typeof followUpNote !== "string" || followUpNote.trim().length < 5) {
        validationDetails.push({
          field: "followUpNote",
          issue: "Follow-up note is required and must be at least 5 characters when followUpRequired is true.",
        });
      } else if (followUpNote.trim().length > 1000) {
        validationDetails.push({
          field: "followUpNote",
          issue: "Follow-up note must not exceed 1000 characters.",
        });
      }
    }

    // Validate attachmentNotes (optional, max 500 chars)
    if (attachmentNotes && typeof attachmentNotes === "string" && attachmentNotes.trim().length > 500) {
      validationDetails.push({
        field: "attachmentNotes",
        issue: "Attachment notes must not exceed 500 characters.",
      });
    }

    if (validationDetails.length > 0) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: validationDetails[0].issue,
          details: validationDetails,
        },
      });
    }

    // Atomic creation and ticket claim race protection in single transaction
    const { action, currentOwnerId } = await getPrisma().$transaction(async (tx) => {
      // Auto-set performerId to authenticated user session (never allow spoofing)
      const createdAction = await tx.actionTaken.create({
        data: {
          ticketId: ticket.id,
          performerId: authUser.id,
          actionDateTime: parsedActionDateTime,
          description: description.trim(),
          result: result.trim(),
          followUpRequired: isFollowUpRequired,
          followUpNote: isFollowUpRequired ? followUpNote.trim() : null,
          attachmentNotes:
            attachmentNotes && typeof attachmentNotes === "string" && attachmentNotes.trim()
              ? attachmentNotes.trim()
              : null,
        },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      let ownerId = ticket.ownerId;
      if (claimTicket === true) {
        const claimResult = await tx.ticket.updateMany({
          where: { id: ticket.id, ownerId: null },
          data: { ownerId: authUser.id },
        });
        if (claimResult.count > 0) {
          ownerId = authUser.id;
        } else {
          const currentTicket = await tx.ticket.findUnique({
            where: { id: ticket.id },
            select: { ownerId: true },
          });
          ownerId = currentTicket?.ownerId ?? null;
        }
      }

      return { action: createdAction, currentOwnerId: ownerId };
    });

    return res.status(201).json({
      action,
      ticketOwnerId: currentOwnerId,
    });
  } catch (error) {
    console.error("Failed to create action taken:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create action taken",
      },
    });
  }
});

// GET /api/tickets/:id/actions - List Actions Taken in chronological order
actionsRouter.get("/", async (req: Request, res: Response) => {
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

    const ticketId = req.params.id || req.params.ticketId;
    const ticket = await getPrisma().ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    // Requester has read-only access strictly to Actions Taken on owned tickets
    if (authUser.role === Role.REQUESTER && ticket.requesterId !== authUser.id) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied to unowned ticket actions",
        },
      });
    }

    const actions = await getPrisma().actionTaken.findMany({
      where: { ticketId: ticket.id },
      orderBy: { actionDateTime: "asc" },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      ticketId: ticket.id,
      actions,
      totalActions: actions.length,
    });
  } catch (error) {
    console.error("Failed to fetch actions taken:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch actions taken",
      },
    });
  }
});

// PATCH /api/tickets/:id/actions/:actionId - Update Action Taken
actionsRouter.patch("/:actionId", async (req: Request, res: Response) => {
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

    if (authUser.role === Role.REQUESTER) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Requesters are not permitted to update actions taken",
        },
      });
    }

    const ticketId = req.params.id || req.params.ticketId;
    const { actionId } = req.params;
    const ticket = await getPrisma().ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    // Terminal tickets (CLOSED, CANCELLED) cannot accept action updates
    if (ticket.currentStatus === TicketStatus.CLOSED || ticket.currentStatus === TicketStatus.CANCELLED) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: `Cannot update actions on a ticket with terminal status ${ticket.currentStatus}.`,
        },
      });
    }

    const existingAction = await getPrisma().actionTaken.findFirst({
      where: {
        id: actionId,
        ticketId: ticket.id,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!existingAction) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Action taken not found for this ticket",
        },
      });
    }

    const {
      description,
      result,
      followUpRequired,
      followUpNote,
      attachmentNotes,
      expectedUpdatedAt,
    } = req.body || {};

    // OCC: expectedUpdatedAt must be supplied and be a valid ISO date string (BR-16)
    if (
      !expectedUpdatedAt ||
      typeof expectedUpdatedAt !== "string" ||
      isNaN(new Date(expectedUpdatedAt).getTime())
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: "expectedUpdatedAt is required and must be a valid ISO date string for optimistic concurrency control.",
          details: [
            {
              field: "expectedUpdatedAt",
              issue: "expectedUpdatedAt is required and must be a valid ISO date string.",
            },
          ],
        },
      });
    }

    const validationDetails: Array<{ field: string; issue: string }> = [];

    // Reject non-boolean followUpRequired
    if (followUpRequired !== undefined && typeof followUpRequired !== "boolean") {
      validationDetails.push({
        field: "followUpRequired",
        issue: "followUpRequired must be a boolean (true or false).",
      });
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length < 10) {
        validationDetails.push({
          field: "description",
          issue: "Description must be at least 10 characters.",
        });
      } else if (description.trim().length > 2000) {
        validationDetails.push({
          field: "description",
          issue: "Description must not exceed 2000 characters.",
        });
      }
    }

    if (result !== undefined) {
      if (typeof result !== "string" || result.trim().length < 3) {
        validationDetails.push({
          field: "result",
          issue: "Result must be at least 3 characters.",
        });
      } else if (result.trim().length > 500) {
        validationDetails.push({
          field: "result",
          issue: "Result must not exceed 500 characters.",
        });
      }
    }

    const nextFollowUpRequired =
      followUpRequired !== undefined ? Boolean(followUpRequired) : existingAction.followUpRequired;

    let nextFollowUpNote = existingAction.followUpNote;
    if (nextFollowUpRequired) {
      if (followUpNote !== undefined) {
        if (!followUpNote || typeof followUpNote !== "string" || followUpNote.trim().length < 5) {
          validationDetails.push({
            field: "followUpNote",
            issue: "Follow-up note is required and must be at least 5 characters when followUpRequired is true.",
          });
        } else if (followUpNote.trim().length > 1000) {
          validationDetails.push({
            field: "followUpNote",
            issue: "Follow-up note must not exceed 1000 characters.",
          });
        } else {
          nextFollowUpNote = followUpNote.trim();
        }
      } else if (!existingAction.followUpNote || existingAction.followUpNote.trim().length < 5) {
        validationDetails.push({
          field: "followUpNote",
          issue: "Follow-up note is required when followUpRequired is true.",
        });
      }
    } else {
      nextFollowUpNote = null;
    }

    if (attachmentNotes !== undefined && attachmentNotes !== null) {
      if (typeof attachmentNotes === "string" && attachmentNotes.trim().length > 500) {
        validationDetails.push({
          field: "attachmentNotes",
          issue: "Attachment notes must not exceed 500 characters.",
        });
      }
    }

    if (validationDetails.length > 0) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: validationDetails[0].issue,
          details: validationDetails,
        },
      });
    }

    // Atomic OCC comparison using updateMany matching exact updatedAt timestamp
    const updateResult = await getPrisma().actionTaken.updateMany({
      where: {
        id: existingAction.id,
        ticketId: ticket.id,
        updatedAt: new Date(expectedUpdatedAt),
      },
      data: {
        description: description !== undefined ? description.trim() : undefined,
        result: result !== undefined ? result.trim() : undefined,
        followUpRequired: nextFollowUpRequired,
        followUpNote: nextFollowUpNote,
        attachmentNotes:
          attachmentNotes !== undefined
            ? (attachmentNotes && typeof attachmentNotes === "string" ? attachmentNotes.trim() : null)
            : undefined,
      },
    });

    if (updateResult.count === 0) {
      return res.status(409).json({
        error: {
          code: "STALE_UPDATE",
          message: "Stale update detected. Another user modified this action taken.",
        },
      });
    }

    const updated = await getPrisma().actionTaken.findUnique({
      where: { id: existingAction.id },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      action: updated,
    });
  } catch (error) {
    console.error("Failed to update action taken:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update action taken",
      },
    });
  }
});
