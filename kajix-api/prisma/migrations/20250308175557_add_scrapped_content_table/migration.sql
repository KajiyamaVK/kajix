-- CreateTable
CREATE TABLE "scrapped_contents" (
    "id" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "scrappedUrl" TEXT NOT NULL,
    "lastScrappedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "htmlContent" TEXT NOT NULL,
    "markdownContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scrapped_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scrapped_contents_scrappedUrl_key" ON "scrapped_contents"("scrappedUrl");
