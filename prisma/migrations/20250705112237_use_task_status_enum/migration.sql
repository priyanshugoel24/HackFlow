/*
  Warnings:

  - The `status` column on the `ContextCard` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- AlterTable
ALTER TABLE "ContextCard" DROP COLUMN "status",
ADD COLUMN     "status" "TaskStatus" DEFAULT 'ACTIVE';
