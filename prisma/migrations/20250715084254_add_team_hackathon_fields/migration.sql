-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "hackathonDeadline" TIMESTAMP(3),
ADD COLUMN     "hackathonModeEnabled" BOOLEAN NOT NULL DEFAULT false;
