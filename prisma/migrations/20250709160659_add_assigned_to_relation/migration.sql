-- AlterTable
ALTER TABLE "ContextCard" ADD COLUMN     "assignedToId" TEXT;

-- CreateIndex
CREATE INDEX "ContextCard_assignedToId_idx" ON "ContextCard"("assignedToId");

-- AddForeignKey
ALTER TABLE "ContextCard" ADD CONSTRAINT "ContextCard_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
