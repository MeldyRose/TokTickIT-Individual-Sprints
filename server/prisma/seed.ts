import { getPrisma } from "../src/prisma.js";

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

const REQUESTERS = [
  { id: "req-user-001", name: "Jennifer Anderson", email: "jennifer.a@example.com", isActive: true },
  { id: "req-user-002", name: "Michael Brown", email: "michael.b@example.com", isActive: true },
  { id: "req-user-003", name: "David Lee", email: "david.l@example.com", isActive: true },
  { id: "req-user-004", name: "Sarah Johnson", email: "sarah.j@example.com", isActive: true },
  { id: "req-user-005", name: "Inactive User Test", email: "inactive@example.com", isActive: false },
];

async function main() {
  const prisma = getPrisma();

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, description: cat.description, isActive: cat.isActive },
      create: cat,
    });
  }

  for (const sys of RELATED_SYSTEMS) {
    await prisma.relatedSystem.upsert({
      where: { id: sys.id },
      update: { name: sys.name, isActive: sys.isActive },
      create: sys,
    });
  }

  for (const req of REQUESTERS) {
    await prisma.requesterUser.upsert({
      where: { id: req.id },
      update: { name: req.name, email: req.email, isActive: req.isActive },
      create: req,
    });
  }

  console.log("Seeded database successfully with categories, related systems, and requesters.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
