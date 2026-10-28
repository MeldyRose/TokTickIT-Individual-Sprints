import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, RequestedPriority, ITPriority, TicketStatus } from "@prisma/client";

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("Password123!", 10);

const CATEGORIES = [
  { id: "cat-acc-001", name: "Account and Access", description: "Login, permissions, password resets", isActive: true },
  { id: "cat-hwd-002", name: "Hardware", description: "Laptops, monitors, peripherals, printers", isActive: true },
  { id: "cat-sfw-003", name: "Software", description: "Operating system, applications, installation", isActive: true },
  { id: "cat-net-004", name: "Network", description: "Wi-Fi, VPN, internet connectivity", isActive: true },
];

const RELATED_SYSTEMS = [
  { id: "sys-001", name: "Email", isActive: true },
  { id: "sys-002", name: "Campus Wi-Fi", isActive: true },
  { id: "sys-003", name: "VPN", isActive: true },
  { id: "sys-004", name: "LEB2 App", isActive: true },
  { id: "sys-005", name: "Grade Submission App", isActive: true },
  { id: "sys-006", name: "Printer", isActive: true },
  { id: "sys-007", name: "Corporate Laptop", isActive: true },
];

const USERS = [
  // Requesters (4 active + 1 inactive)
  {
    id: "req-user-001",
    name: "Jennifer Anderson",
    email: "jennifer.a@example.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: true,
  },
  {
    id: "req-user-002",
    name: "Michael Brown",
    email: "michael.b@example.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
  },
  {
    id: "req-user-003",
    name: "David Lee",
    email: "david.l@example.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
  },
  {
    id: "req-user-004",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
  },
  {
    id: "req-user-005",
    name: "Inactive User Test",
    email: "inactive@example.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.REQUESTER,
    isActive: false,
    mustChangePassword: false,
  },
  // IT Staff (3 active + 1 inactive)
  {
    id: "staff-user-001",
    name: "Alex Thompson",
    email: "alex.thompson@toktickit.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.IT_STAFF,
    isActive: true,
    mustChangePassword: false,
  },
  {
    id: "staff-user-002",
    name: "Lisa Martinez",
    email: "lisa.martinez@toktickit.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.IT_STAFF,
    isActive: true,
    mustChangePassword: false,
  },
  {
    id: "staff-user-003",
    name: "Kevin Patel",
    email: "kevin.patel@toktickit.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.IT_STAFF,
    isActive: true,
    mustChangePassword: false,
  },
  {
    id: "staff-user-004",
    name: "Inactive Staff Test",
    email: "inactive.staff@toktickit.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.IT_STAFF,
    isActive: false,
    mustChangePassword: false,
  },
  // Administrator (1 active)
  {
    id: "admin-user-001",
    name: "Admin User",
    email: "admin@toktickit.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: Role.ADMINISTRATOR,
    isActive: true,
    mustChangePassword: false,
  },
];

const TICKETS = [
  {
    id: "tkt-001",
    ticketNumber: "TKT-2026-0001",
    summary: "Cannot access LEB2 App after password update",
    description: "I updated my password yesterday and now I get an Access Denied error when logging into LEB2.",
    categoryId: "cat-acc-001",
    relatedSystemId: "sys-004",
    requestedPriority: RequestedPriority.HIGH,
    itPriority: ITPriority.HIGH,
    currentStatus: TicketStatus.IN_PROGRESS,
    requesterId: "req-user-001",
    ownerId: "staff-user-001",
    resolvedAt: null,
    closedAt: null,
    resolutionSummary: null,
  },
  {
    id: "tkt-002",
    ticketNumber: "TKT-2026-0002",
    summary: "VPN connection keeps dropping on Wi-Fi",
    description: "The corporate VPN drops connection every 10-15 minutes when connected to Campus Wi-Fi.",
    categoryId: "cat-net-004",
    relatedSystemId: "sys-003",
    requestedPriority: RequestedPriority.MEDIUM,
    itPriority: ITPriority.MEDIUM,
    currentStatus: TicketStatus.NEW,
    requesterId: "req-user-002",
    ownerId: null,
    resolvedAt: null,
    closedAt: null,
    resolutionSummary: null,
  },
  {
    id: "tkt-003",
    ticketNumber: "TKT-2026-0003",
    summary: "Printer on 3rd floor jammed and offline",
    description: "The main department printer on the 3rd floor is showing Error Code 52 paper jam.",
    categoryId: "cat-hwd-002",
    relatedSystemId: "sys-006",
    requestedPriority: RequestedPriority.LOW,
    itPriority: ITPriority.LOW,
    currentStatus: TicketStatus.OPEN,
    requesterId: "req-user-003",
    ownerId: "staff-user-002",
    resolvedAt: null,
    closedAt: null,
    resolutionSummary: null,
  },
  {
    id: "tkt-004",
    ticketNumber: "TKT-2026-0004",
    summary: "Request for SPSS software license renewal",
    description: "My SPSS statistics license expired yesterday. Need license key extension for research project.",
    categoryId: "cat-sfw-003",
    relatedSystemId: "sys-005",
    requestedPriority: RequestedPriority.MEDIUM,
    itPriority: ITPriority.MEDIUM,
    currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
    requesterId: "req-user-004",
    ownerId: "staff-user-001",
    resolvedAt: null,
    closedAt: null,
    resolutionSummary: null,
  },
  {
    id: "tkt-005",
    ticketNumber: "TKT-2026-0005",
    summary: "Email sync error on mobile phone",
    description: "Outlook app on mobile is not syncing new inbox messages since this morning.",
    categoryId: "cat-acc-001",
    relatedSystemId: "sys-001",
    requestedPriority: RequestedPriority.URGENT,
    itPriority: ITPriority.URGENT,
    currentStatus: TicketStatus.RESOLVED,
    requesterId: "req-user-001",
    ownerId: "staff-user-003",
    resolvedAt: new Date(),
    closedAt: null,
    resolutionSummary: "Re-configured Exchange ActiveSync profile on device and verified TLS certificate trust chain. Mobile sync completed successfully.",
  },
  {
    id: "tkt-006",
    ticketNumber: "TKT-2026-0006",
    summary: "Campus Wi-Fi drops in Building 3, Room 302",
    description: "Students and faculty report wireless disconnects every few minutes in room 302.",
    categoryId: "cat-net-004",
    relatedSystemId: "sys-002",
    requestedPriority: RequestedPriority.HIGH,
    itPriority: ITPriority.HIGH,
    currentStatus: TicketStatus.CLOSED,
    requesterId: "req-user-002",
    ownerId: "staff-user-002",
    resolvedAt: new Date(Date.now() - 86400 * 1000 * 5),
    closedAt: new Date(Date.now() - 86400 * 1000 * 4),
    resolutionSummary: "Replaced faulty wireless access point AP-B3-302 with spare Cisco Catalyst AP and verified coverage.",
  },
  {
    id: "tkt-007",
    ticketNumber: "TKT-2026-0007",
    summary: "Intermittent packet loss on lab switch",
    description: "Packet drops recurred during heavy afternoon lab sessions on Switch-SW02.",
    categoryId: "cat-net-004",
    relatedSystemId: "sys-003",
    requestedPriority: RequestedPriority.URGENT,
    itPriority: ITPriority.URGENT,
    currentStatus: TicketStatus.REOPENED,
    requesterId: "req-user-003",
    ownerId: "staff-user-001",
    resolvedAt: null,
    closedAt: null,
    resolutionSummary: null,
  },
  {
    id: "tkt-008",
    ticketNumber: "TKT-2026-0008",
    summary: "SPSS statistics license activation on desktop",
    description: "Need license activation for statistics class teaching station.",
    categoryId: "cat-sfw-003",
    relatedSystemId: "sys-005",
    requestedPriority: RequestedPriority.LOW,
    itPriority: ITPriority.LOW,
    currentStatus: TicketStatus.RESOLVED,
    requesterId: "req-user-004",
    ownerId: "staff-user-003",
    resolvedAt: new Date(Date.now() - 86400 * 1000 * 45),
    closedAt: null,
    resolutionSummary: "Installed network license manager configuration file and validated client license checkout.",
  },
];

const PUBLIC_COMMENTS = [
  {
    id: "comment-001",
    ticketId: "tkt-001",
    authorId: "staff-user-001",
    content: "Investigating authorization server logs to check session token status.",
  },
  {
    id: "comment-002",
    ticketId: "tkt-001",
    authorId: "req-user-001",
    content: "Thank you, I tried clearing browser cache as well but the error persists.",
  },
  {
    id: "comment-003",
    ticketId: "tkt-004",
    authorId: "staff-user-001",
    content: "Please confirm your department cost center code so we can process the software license.",
  },
];

const INTERNAL_NOTES = [
  {
    id: "note-001",
    ticketId: "tkt-001",
    authorId: "staff-user-001",
    content: "User SSO session was locked due to 3 failed attempts. Reset token generated in IAM console.",
  },
  {
    id: "note-002",
    ticketId: "tkt-003",
    authorId: "staff-user-002",
    content: "Paper jam cleared, toner level low at 12%. Scheduled replacement cartridge for Friday.",
  },
];

const ACTIONS_TAKEN = [
  // tkt-001: 2 actions across different IT staff performers (Alex Thompson and Kevin Patel)
  {
    id: "act-001",
    ticketId: "tkt-001",
    performerId: "staff-user-001",
    actionDateTime: new Date("2026-10-28T09:15:00.000Z"),
    description: "Connected to identity provider console and reviewed OAuth token session errors for Jennifer Anderson.",
    result: "Found expired token refresh cache causing authentication loop on LEB2 application.",
    followUpRequired: true,
    followUpNote: "Request IAM administrator to clear cached SAML assertions if issue recurs.",
    attachmentNotes: "idp_trace_leb2.log",
  },
  {
    id: "act-002",
    ticketId: "tkt-001",
    performerId: "staff-user-003",
    actionDateTime: new Date("2026-10-28T10:45:00.000Z"),
    description: "Revoked stale session assertions and re-synchronized user profile permissions across LEB2 tenant.",
    result: "User profile successfully re-indexed. Login challenge prompt refreshed.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
  },
  // tkt-003: 1 action by Lisa Martinez
  {
    id: "act-003",
    ticketId: "tkt-003",
    performerId: "staff-user-002",
    actionDateTime: new Date("2026-10-28T08:30:00.000Z"),
    description: "Inspected physical paper tray 2 and cleared jammed paper scrap from roller feed assembly.",
    result: "Roller turns freely without obstruction. Diagnostic print page dispatched successfully.",
    followUpRequired: true,
    followUpNote: "Order replacement pickup roller rubber kit if paper feed slips again.",
    attachmentNotes: "printer_roller_error52.jpg",
  },
  // tkt-005: 2 actions (resolved ticket, resolved today) by Kevin Patel and Alex Thompson
  {
    id: "act-004",
    ticketId: "tkt-005",
    performerId: "staff-user-003",
    actionDateTime: new Date(Date.now() - 3600 * 1000 * 3),
    description: "Tested connection parameters from mobile network to ActiveSync endpoint.",
    result: "Discovered client certificate was rejected by reverse proxy.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
  },
  {
    id: "act-005",
    ticketId: "tkt-005",
    performerId: "staff-user-001",
    actionDateTime: new Date(Date.now() - 3600 * 1000 * 1),
    description: "Pushed updated enterprise root CA certificate profile to user mobile device via MDM.",
    result: "Exchange profile authenticated and downloaded new messages.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: "exchange_activesync_success.png",
  },
  // tkt-006: 1 action by Lisa Martinez
  {
    id: "act-006",
    ticketId: "tkt-006",
    performerId: "staff-user-002",
    actionDateTime: new Date(Date.now() - 86400 * 1000 * 5),
    description: "Ran cable diagnostic on patch panel port 14 and identified open pair at 12 meters.",
    result: "Confirmed severed RJ45 connector crimp on wall jack.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
  },
  // tkt-007: 1 action by Alex Thompson
  {
    id: "act-007",
    ticketId: "tkt-007",
    performerId: "staff-user-001",
    actionDateTime: new Date(Date.now() - 3600 * 1000 * 5),
    description: "Re-opened investigation after user reported intermittent packet loss resumed on Switch-SW02.",
    result: "Captured tcpdump packet traces and identified buffer overruns during peak hours.",
    followUpRequired: true,
    followUpNote: "Schedule off-hours firmware upgrade for Switch-SW02.",
    attachmentNotes: "switch_buffer_drop.pcapng",
  },
  // tkt-008: 1 action by Kevin Patel
  {
    id: "act-008",
    ticketId: "tkt-008",
    performerId: "staff-user-003",
    actionDateTime: new Date(Date.now() - 86400 * 1000 * 45),
    description: "Provisioned SPSS statistics network license seat and updated client license configuration.",
    result: "SPSS software launched and license checkout confirmed on server.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
  },
];

async function main() {
  const prisma = getPrisma();

  // 1. Categories
  for (const cat of CATEGORIES) {
    const existing = await prisma.category.findFirst({ where: { OR: [{ id: cat.id }, { name: cat.name }] } });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { id: cat.id, name: cat.name, description: cat.description, isActive: cat.isActive },
      });
    } else {
      await prisma.category.create({ data: cat });
    }
  }

  // 2. Related Systems
  for (const sys of RELATED_SYSTEMS) {
    const existing = await prisma.relatedSystem.findFirst({ where: { OR: [{ id: sys.id }, { name: sys.name }] } });
    if (existing) {
      await prisma.relatedSystem.update({
        where: { id: existing.id },
        data: { id: sys.id, name: sys.name, isActive: sys.isActive },
      });
    } else {
      await prisma.relatedSystem.create({ data: sys });
    }
  }

  // 3. Users
  const userMap: Record<string, string> = {};
  for (const u of USERS) {
    const existing = await prisma.user.findFirst({ where: { OR: [{ id: u.id }, { email: u.email }] } });
    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          role: u.role,
          isActive: u.isActive,
          mustChangePassword: u.mustChangePassword,
        },
      });
      userMap[u.id] = updated.id;
    } else {
      const created = await prisma.user.create({ data: u });
      userMap[u.id] = created.id;
    }
  }

  // Maps for Categories and Related Systems
  const dbCategories = await prisma.category.findMany();
  const dbSystems = await prisma.relatedSystem.findMany();
  const catMap = Object.fromEntries(dbCategories.map((c) => [c.name, c.id]));
  const sysMap = Object.fromEntries(dbSystems.map((s) => [s.name, s.id]));

  // 4. Tickets
  const ticketMap: Record<string, string> = {};
  for (const t of TICKETS) {
    const mappedCatName = CATEGORIES.find((c) => c.id === t.categoryId)?.name;
    const mappedSysName = RELATED_SYSTEMS.find((s) => s.id === t.relatedSystemId)?.name;
    const catId = mappedCatName && catMap[mappedCatName] ? catMap[mappedCatName] : t.categoryId;
    const sysId = mappedSysName && sysMap[mappedSysName] ? sysMap[mappedSysName] : t.relatedSystemId;
    const reqId = userMap[t.requesterId] || t.requesterId;
    const ownId = t.ownerId ? (userMap[t.ownerId] || t.ownerId) : null;

    const existing = await prisma.ticket.findFirst({ where: { OR: [{ id: t.id }, { ticketNumber: t.ticketNumber }] } });
    if (existing) {
      const updated = await prisma.ticket.update({
        where: { id: existing.id },
        data: {
          id: t.id,
          ticketNumber: t.ticketNumber,
          summary: t.summary,
          description: t.description,
          categoryId: catId,
          relatedSystemId: sysId,
          requestedPriority: t.requestedPriority,
          itPriority: t.itPriority,
          currentStatus: t.currentStatus,
          requesterId: reqId,
          ownerId: ownId,
          resolvedAt: t.resolvedAt ?? null,
          closedAt: t.closedAt ?? null,
          resolutionSummary: t.resolutionSummary ?? null,
        },
      });
      ticketMap[t.id] = updated.id;
    } else {
      const created = await prisma.ticket.create({
        data: {
          id: t.id,
          ticketNumber: t.ticketNumber,
          summary: t.summary,
          description: t.description,
          categoryId: catId,
          relatedSystemId: sysId,
          requestedPriority: t.requestedPriority,
          itPriority: t.itPriority,
          currentStatus: t.currentStatus,
          requesterId: reqId,
          ownerId: ownId,
          resolvedAt: t.resolvedAt ?? null,
          closedAt: t.closedAt ?? null,
          resolutionSummary: t.resolutionSummary ?? null,
        },
      });
      ticketMap[t.id] = created.id;
    }
  }

  // 5. Public Comments
  for (const c of PUBLIC_COMMENTS) {
    const tId = ticketMap[c.ticketId] || c.ticketId;
    const aId = userMap[c.authorId] || c.authorId;

    const existing = await prisma.publicComment.findUnique({ where: { id: c.id } });
    if (existing) {
      await prisma.publicComment.update({
        where: { id: existing.id },
        data: {
          ticketId: tId,
          authorId: aId,
          content: c.content,
        },
      });
    } else {
      await prisma.publicComment.create({
        data: {
          id: c.id,
          ticketId: tId,
          authorId: aId,
          content: c.content,
        },
      });
    }
  }

  // 6. Internal Notes
  for (const n of INTERNAL_NOTES) {
    const tId = ticketMap[n.ticketId] || n.ticketId;
    const aId = userMap[n.authorId] || n.authorId;

    const existing = await prisma.internalNote.findUnique({ where: { id: n.id } });
    if (existing) {
      await prisma.internalNote.update({
        where: { id: existing.id },
        data: {
          ticketId: tId,
          authorId: aId,
          content: n.content,
        },
      });
    } else {
      await prisma.internalNote.create({
        data: {
          id: n.id,
          ticketId: tId,
          authorId: aId,
          content: n.content,
        },
      });
    }
  }

  // 7. Actions Taken
  for (const a of ACTIONS_TAKEN) {
    const tId = ticketMap[a.ticketId] || a.ticketId;
    const pId = userMap[a.performerId] || a.performerId;

    const existing = await prisma.actionTaken.findUnique({ where: { id: a.id } });
    if (existing) {
      await prisma.actionTaken.update({
        where: { id: existing.id },
        data: {
          ticketId: tId,
          performerId: pId,
          actionDateTime: a.actionDateTime,
          description: a.description,
          result: a.result,
          followUpRequired: a.followUpRequired,
          followUpNote: a.followUpNote,
          attachmentNotes: a.attachmentNotes,
        },
      });
    } else {
      await prisma.actionTaken.create({
        data: {
          id: a.id,
          ticketId: tId,
          performerId: pId,
          actionDateTime: a.actionDateTime,
          description: a.description,
          result: a.result,
          followUpRequired: a.followUpRequired,
          followUpNote: a.followUpNote,
          attachmentNotes: a.attachmentNotes,
        },
      });
    }
  }

  console.log("Seeded database successfully with categories, related systems, users, tickets, public comments, internal notes, and actions taken.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
