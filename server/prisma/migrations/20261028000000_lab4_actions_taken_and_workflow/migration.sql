-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "resolutionSummary" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "actions_taken" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "performerId" TEXT NOT NULL,
    "actionDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNote" TEXT,
    "attachmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_taken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "actions_taken_ticketId_idx" ON "actions_taken"("ticketId");

-- CreateIndex
CREATE INDEX "actions_taken_performerId_idx" ON "actions_taken"("performerId");

-- CreateIndex
CREATE INDEX "actions_taken_actionDateTime_idx" ON "actions_taken"("actionDateTime");

-- CreateIndex
CREATE INDEX "tickets_resolvedAt_idx" ON "tickets"("resolvedAt");

-- AddForeignKey
ALTER TABLE "actions_taken" ADD CONSTRAINT "actions_taken_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions_taken" ADD CONSTRAINT "actions_taken_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
