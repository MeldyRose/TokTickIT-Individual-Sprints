export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${year}-${randomNum}`;
}
