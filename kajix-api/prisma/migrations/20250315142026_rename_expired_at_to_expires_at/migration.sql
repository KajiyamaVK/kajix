/*
  Warnings:

  - You are about to drop the column `expired_at` on the `tmp_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tmp_tokens" DROP COLUMN "expired_at",
ADD COLUMN     "expires_at" TIMESTAMP(3);
