-- CreateTable
CREATE TABLE "tmp_tokens" (
    "id" SERIAL NOT NULL,
    "type" INTEGER NOT NULL,
    "emailFrom" TEXT NOT NULL,
    "emailTo" TEXT NOT NULL,
    "token" TEXT,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "expired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tmp_tokens_pkey" PRIMARY KEY ("id")
);
