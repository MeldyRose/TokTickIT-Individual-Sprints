import { Router, Request, Response } from "express";
import { Role, TicketStatus, ITPriority } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { resolveAuthUser } from "../utils/auth.js";
import {
  ACTIVE_TICKET_STATUSES,
  getStartOfDay,
  getDaysAgo,
  calculateAverageResolution,
} from "../utils/dashboardUtils.js";

export const dashboardRouter = Router();

// GET /api/dashboard/requester - Requester Personalized Dashboard
dashboardRouter.get("/requester", async (req: Request, res: Response) => {
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

    if (authUser.role !== Role.REQUESTER) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Forbidden: Requester dashboard is only accessible to requesters",
        },
      });
    }

    const prisma = getPrisma();
    const requesterId = authUser.id;
    const sevenDaysAgo = getDaysAgo(7);

    // Run authoritative queries strictly scoped to authenticated requester
    const [
      totalOpen,
      waitingForRequester,
      recentlyUpdated,
      recentlyResolved,
      recentTicketsRaw,
    ] = await Promise.all([
      // Total open/active tickets
      prisma.ticket.count({
        where: {
          requesterId,
          currentStatus: { in: ACTIVE_TICKET_STATUSES },
        },
      }),
      // Tickets waiting for requester feedback
      prisma.ticket.count({
        where: {
          requesterId,
          currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
        },
      }),
      // Recently updated tickets in past 7 days
      prisma.ticket.count({
        where: {
          requesterId,
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      // Recently resolved tickets in past 7 days strictly per BR-20 (resolvedAt within 7 days)
      prisma.ticket.count({
        where: {
          requesterId,
          resolvedAt: { gte: sevenDaysAgo },
        },
      }),
      // Top 5 recent tickets for the requester
      prisma.ticket.findMany({
        where: { requesterId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          currentStatus: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const recentTickets = recentTicketsRaw.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      currentStatus: t.currentStatus,
      actionRequired: t.currentStatus === TicketStatus.WAITING_FOR_REQUESTER,
      updatedAt: t.updatedAt,
      createdAt: t.createdAt,
    }));

    return res.status(200).json({
      metrics: {
        totalOpen,
        totalActive: totalOpen,
        waitingForRequester,
        waitingForMyInput: waitingForRequester,
        recentlyUpdated,
        recentlyResolved,
        resolvedRecently: recentlyResolved,
      },
      recentTickets,
      recentActivity: recentTickets,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating requester dashboard:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate requester dashboard",
      },
    });
  }
});

// GET /api/dashboard/staff - IT Staff & Administrator Operations Dashboard
dashboardRouter.get("/staff", async (req: Request, res: Response) => {
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
          message: "Forbidden: Staff dashboard is only accessible to IT Staff and Administrators",
        },
      });
    }

    const prisma = getPrisma();
    const startOfDay = getStartOfDay();
    const thirtyDaysAgo = getDaysAgo(30);
    const sevenDaysAgo = getDaysAgo(7);

    const [
      totalOpen,
      unassigned,
      myAssigned,
      waitingForRequester,
      urgentOrHigh,
      resolvedToday,
      recentlyUpdated,
      resolved30d,
      statusGroup,
      priorityGroup,
      recentTicketsRaw,
      recentUrgentRaw,
    ] = await Promise.all([
      // Total open tickets across system
      prisma.ticket.count({
        where: { currentStatus: { in: ACTIVE_TICKET_STATUSES } },
      }),
      // Unassigned active tickets
      prisma.ticket.count({
        where: {
          currentStatus: { in: ACTIVE_TICKET_STATUSES },
          ownerId: null,
        },
      }),
      // Tickets assigned to calling IT staff
      prisma.ticket.count({
        where: {
          currentStatus: { in: ACTIVE_TICKET_STATUSES },
          ownerId: authUser.id,
        },
      }),
      // Tickets waiting for requester
      prisma.ticket.count({
        where: { currentStatus: TicketStatus.WAITING_FOR_REQUESTER },
      }),
      // Active urgent or high priority tickets
      prisma.ticket.count({
        where: {
          currentStatus: { in: ACTIVE_TICKET_STATUSES },
          itPriority: { in: [ITPriority.URGENT, ITPriority.HIGH] },
        },
      }),
      // Resolved today (resolvedAt >= midnight today)
      prisma.ticket.count({
        where: {
          resolvedAt: { gte: startOfDay },
        },
      }),
      // Recently updated tickets in past 7 days across queue
      prisma.ticket.count({
        where: {
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      // Tickets resolved in last 30 days for average resolution calculation
      prisma.ticket.findMany({
        where: {
          resolvedAt: { gte: thirtyDaysAgo },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      }),
      // Status breakdown
      prisma.ticket.groupBy({
        by: ["currentStatus"],
        _count: { currentStatus: true },
      }),
      // Priority breakdown
      prisma.ticket.groupBy({
        by: ["itPriority"],
        _count: { itPriority: true },
      }),
      // Top 10 recent tickets
      prisma.ticket.findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          requester: { select: { name: true } },
          owner: { select: { name: true } },
        },
      }),
      // Top 5 recent urgent tickets
      prisma.ticket.findMany({
        where: {
          itPriority: ITPriority.URGENT,
          currentStatus: { in: ACTIVE_TICKET_STATUSES },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          requester: { select: { name: true } },
          owner: { select: { name: true } },
        },
      }),
    ]);

    // Average resolution time
    const { avgMinutes, formatted: avgResolutionFormatted } =
      calculateAverageResolution(resolved30d);

    // Format breakdown distributions ensuring all enum values are present (even when count is 0)
    const totalStatusCount = statusGroup.reduce(
      (sum, g) => sum + g._count.currentStatus,
      0
    );
    const statusMap = new Map(statusGroup.map((g) => [g.currentStatus, g._count.currentStatus]));
    const allStatuses = Object.values(TicketStatus);
    const byStatus = allStatuses.map((status) => {
      const count = statusMap.get(status) || 0;
      return {
        status,
        count,
        percentage:
          totalStatusCount > 0
            ? Number(((count / totalStatusCount) * 100).toFixed(1))
            : 0,
      };
    });

    const totalPriorityCount = priorityGroup.reduce(
      (sum, g) => sum + g._count.itPriority,
      0
    );
    const priorityMap = new Map(priorityGroup.map((g) => [g.itPriority, g._count.itPriority]));
    const allPriorities = [ITPriority.URGENT, ITPriority.HIGH, ITPriority.MEDIUM, ITPriority.LOW];
    const byPriority = allPriorities.map((priority) => {
      const count = priorityMap.get(priority) || 0;
      return {
        priority,
        count,
        percentage:
          totalPriorityCount > 0
            ? Number(((count / totalPriorityCount) * 100).toFixed(1))
            : 0,
      };
    });

    const recentTickets = recentTicketsRaw.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      requesterName: t.requester?.name || "Unknown",
      itPriority: t.itPriority,
      currentStatus: t.currentStatus,
      ownerName: t.owner?.name || null,
      updatedAt: t.updatedAt,
    }));

    const recentUrgentTickets = recentUrgentRaw.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      requesterName: t.requester?.name || "Unknown",
      itPriority: t.itPriority,
      currentStatus: t.currentStatus,
      ownerName: t.owner?.name || null,
      updatedAt: t.updatedAt,
    }));

    // Administrator overview support
    let adminOverview;
    if (authUser.role === Role.ADMINISTRATOR) {
      const [totalUsers, activeStaff, activeRequesters] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            isActive: true,
            role: { in: [Role.IT_STAFF, Role.ADMINISTRATOR] },
          },
        }),
        prisma.user.count({
          where: {
            isActive: true,
            role: Role.REQUESTER,
          },
        }),
      ]);
      adminOverview = {
        totalUsers,
        activeStaff,
        activeRequesters,
      };
    }

    return res.status(200).json({
      metrics: {
        totalOpen,
        unassigned,
        ownedByMe: myAssigned,
        myAssigned,
        waitingForRequester,
        urgentOrHigh,
        resolvedToday,
        avgResolutionMinutes: avgMinutes,
        avgResolutionFormatted,
        recentlyUpdated,
      },
      breakdown: {
        byStatus,
        byPriority,
      },
      ticketsByStatus: byStatus,
      ticketsByPriority: byPriority,
      recentTickets,
      recentUrgentTickets,
      adminOverview,
      calculatedAt: new Date().toISOString(),
      timeWindowDays: 30,
    });
  } catch (error) {
    console.error("Error generating staff dashboard:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate staff dashboard",
      },
    });
  }
});

// GET /api/dashboard/staff/breakdown - Queue Breakdown Endpoints (api-spec 4.2)
dashboardRouter.get("/staff/breakdown", async (req: Request, res: Response) => {
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
          message: "Forbidden: Staff dashboard is only accessible to IT Staff and Administrators",
        },
      });
    }

    const prisma = getPrisma();
    const [statusGroup, priorityGroup, categoryGroup, categories] =
      await Promise.all([
        prisma.ticket.groupBy({
          by: ["currentStatus"],
          _count: { currentStatus: true },
        }),
        prisma.ticket.groupBy({
          by: ["itPriority"],
          _count: { itPriority: true },
        }),
        prisma.ticket.groupBy({
          by: ["categoryId"],
          _count: { categoryId: true },
        }),
        prisma.category.findMany(),
      ]);

    const totalStatus = statusGroup.reduce(
      (sum, g) => sum + g._count.currentStatus,
      0
    );
    const statusMap = new Map(statusGroup.map((g) => [g.currentStatus, g._count.currentStatus]));
    const allStatuses = Object.values(TicketStatus);
    const byStatus = allStatuses.map((status) => {
      const count = statusMap.get(status) || 0;
      return {
        status,
        count,
        percentage:
          totalStatus > 0
            ? Number(((count / totalStatus) * 100).toFixed(1))
            : 0,
      };
    });

    const totalPriority = priorityGroup.reduce(
      (sum, g) => sum + g._count.itPriority,
      0
    );
    const priorityMap = new Map(priorityGroup.map((g) => [g.itPriority, g._count.itPriority]));
    const allPriorities = [ITPriority.URGENT, ITPriority.HIGH, ITPriority.MEDIUM, ITPriority.LOW];
    const byPriority = allPriorities.map((priority) => {
      const count = priorityMap.get(priority) || 0;
      return {
        priority,
        count,
        percentage:
          totalPriority > 0
            ? Number(((count / totalPriority) * 100).toFixed(1))
            : 0,
      };
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const totalCategory = categoryGroup.reduce(
      (sum, g) => sum + g._count.categoryId,
      0
    );
    const byCategory = categoryGroup.map((g) => ({
      categoryId: g.categoryId,
      categoryName: categoryMap.get(g.categoryId) || "Unknown",
      count: g._count.categoryId,
      percentage:
        totalCategory > 0
          ? Number(((g._count.categoryId / totalCategory) * 100).toFixed(1))
          : 0,
    }));

    return res.status(200).json({
      byStatus,
      byPriority,
      byCategory,
    });
  } catch (error) {
    console.error("Error generating queue breakdown:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate queue breakdown",
      },
    });
  }
});
