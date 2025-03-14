/*
  Warnings:

  - You are about to drop the column `isActive` on the `llm_companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "llm_companies" DROP COLUMN "isActive",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
