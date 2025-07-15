/*
  Warnings:

  - The values [ADMIN] on the enum `TeamRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TeamRole_new" AS ENUM ('OWNER', 'MEMBER');
ALTER TABLE "TeamMember" ALTER COLUMN "role" TYPE "TeamRole_new" USING ("role"::text::"TeamRole_new");
ALTER TYPE "TeamRole" RENAME TO "TeamRole_old";
ALTER TYPE "TeamRole_new" RENAME TO "TeamRole";
DROP TYPE "TeamRole_old";
COMMIT;
