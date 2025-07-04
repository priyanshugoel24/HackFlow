-- AlterTable
ALTER TABLE "ContextCard" ADD COLUMN     "projectId" TEXT;

-- AddForeignKey
ALTER TABLE "ContextCard" ADD CONSTRAINT "ContextCard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
