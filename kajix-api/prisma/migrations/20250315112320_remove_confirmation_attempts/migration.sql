/*
  Warnings:

  - You are about to drop the column `confirmation_attempts` on the `tmp_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tmp_tokens" DROP COLUMN "confirmation_attempts";
