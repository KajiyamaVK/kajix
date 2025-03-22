/*
  Warnings:

  - Changed the type of `locale` on the `tmp_tokens` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'ptbr');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TokenType" ADD VALUE 'EMAIL_CHANGE';
ALTER TYPE "TokenType" ADD VALUE 'ACCESS_TOKEN';
ALTER TYPE "TokenType" ADD VALUE 'REFRESH_TOKEN';
ALTER TYPE "TokenType" ADD VALUE 'PASSWORD_RESET';

-- AlterTable
ALTER TABLE "tmp_tokens" 
  ALTER COLUMN "locale" DROP DEFAULT,
  ALTER COLUMN "locale" TYPE "Locale" USING CASE 
    WHEN "locale" = 'en' THEN 'en'::"Locale"
    WHEN "locale" = 'ptbr' THEN 'ptbr'::"Locale"
    ELSE 'en'::"Locale"
  END,
  ALTER COLUMN "locale" SET DEFAULT 'en'::"Locale";
