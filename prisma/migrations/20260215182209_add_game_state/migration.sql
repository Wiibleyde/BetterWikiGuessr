-- CreateTable
CREATE TABLE "GameState" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dailyWikiPageId" INTEGER NOT NULL,
    "guesses" JSONB NOT NULL,
    "revealed" JSONB NOT NULL,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameState_userId_dailyWikiPageId_key" ON "GameState"("userId", "dailyWikiPageId");

-- AddForeignKey
ALTER TABLE "GameState" ADD CONSTRAINT "GameState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameState" ADD CONSTRAINT "GameState_dailyWikiPageId_fkey" FOREIGN KEY ("dailyWikiPageId") REFERENCES "DailyWikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
