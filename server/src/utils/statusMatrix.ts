import { TicketStatus } from "@prisma/client";

// Permitted Ticket Status Transitions Matrix (BR-14)
export const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.WAITING_FOR_REQUESTER]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  [TicketStatus.REOPENED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
  [TicketStatus.CLOSED]: [],
  [TicketStatus.CANCELLED]: [],
};

export function isValidStatusTransition(currentStatus: TicketStatus, targetStatus: TicketStatus): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = PERMITTED_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

export function getPermittedNextStatuses(currentStatus: TicketStatus): TicketStatus[] {
  return PERMITTED_STATUS_TRANSITIONS[currentStatus] || [];
}
