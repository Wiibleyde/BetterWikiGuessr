-- CreateTable
CREATE TABLE "DailyWikiPage" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "images" TEXT[],
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyWikiPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyWikiPage_date_key" ON "DailyWikiPage"("date");
