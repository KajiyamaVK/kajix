/*
  Warnings:

  - You are about to drop the column `expires_at` on the `tmp_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token,is_expired]` on the table `tmp_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `tmp_tokens` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `tmp_tokens` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `token` on table `tmp_tokens` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('1');

-- AlterTable
ALTER TABLE "tmp_tokens" DROP COLUMN "expires_at",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TokenType" NOT NULL,
ALTER COLUMN "token" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tmp_tokens_token_is_expired_key" ON "tmp_tokens"("token", "is_expired");
