/*
  Warnings:

  - You are about to drop the column `hackathonDeadline` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `hackathonModeEnabled` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "hackathonDeadline",
DROP COLUMN "hackathonModeEnabled";
