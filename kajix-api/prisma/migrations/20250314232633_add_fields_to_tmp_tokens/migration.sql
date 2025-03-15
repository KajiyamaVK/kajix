-- AlterTable
ALTER TABLE "tmp_tokens" ADD COLUMN     "confirmation_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_used" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';
