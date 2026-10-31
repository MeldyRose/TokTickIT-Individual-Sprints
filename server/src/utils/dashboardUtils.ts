import { TicketStatus } from "@prisma/client";

export const ACTIVE_TICKET_STATUSES: TicketStatus[] = [
  TicketStatus.NEW,
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_REQUESTER,
  TicketStatus.REOPENED,
];

/**
 * Returns a Date representing the beginning of the local day (00:00:00.000)
 */
export function getStartOfDay(referenceDate: Date = new Date()): Date {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a Date n days in the past from the reference date
 */
export function getDaysAgo(days: number, referenceDate: Date = new Date()): Date {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Formats a duration in minutes to human readable string (e.g., "5d 5h 8m", "3h 45m", "45m", "0m")
 */
export function formatResolutionMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";

  const totalMinutes = Math.round(minutes);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const remainingMins = totalMinutes % 60;

  if (days > 0) {
    const parts: string[] = [`${days}d`];
    if (hours > 0) parts.push(`${hours}h`);
    if (remainingMins > 0) parts.push(`${remainingMins}m`);
    return parts.join(" ");
  }

  if (hours === 0) {
    return `${remainingMins}m`;
  }
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Safely calculates the average resolution time in minutes across tickets resolved in the window.
 * Returns 0 and "0m" safely if no tickets were resolved.
 */
export function calculateAverageResolution(
  resolvedTickets: Array<{ createdAt: Date; resolvedAt: Date | null }>
): { avgMinutes: number; formatted: string } {
  const validTickets = resolvedTickets.filter(
    (t) => t.resolvedAt !== null && t.resolvedAt.getTime() >= t.createdAt.getTime()
  );

  if (validTickets.length === 0) {
    return { avgMinutes: 0, formatted: "0m" };
  }

  const totalMilliseconds = validTickets.reduce((acc, t) => {
    return acc + (t.resolvedAt!.getTime() - t.createdAt.getTime());
  }, 0);

  const avgMinutes = Math.round(totalMilliseconds / (validTickets.length * 60 * 1000));
  return {
    avgMinutes,
    formatted: formatResolutionMinutes(avgMinutes),
  };
}
