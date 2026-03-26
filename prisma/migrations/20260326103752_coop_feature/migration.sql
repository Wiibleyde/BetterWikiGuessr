-- CreateTable
CREATE TABLE "CoopLobby" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "wikiTitle" TEXT,
    "wikiSections" JSONB,
    "wikiImages" TEXT[],
    "wikiUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoopLobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoopPlayer" (
    "id" SERIAL NOT NULL,
    "lobbyId" INTEGER NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoopPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoopGuess" (
    "id" SERIAL NOT NULL,
    "lobbyId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "found" BOOLEAN NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 0,
    "similarity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoopGuess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoopLobby_code_key" ON "CoopLobby"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CoopPlayer_token_key" ON "CoopPlayer"("token");

-- AddForeignKey
ALTER TABLE "CoopPlayer" ADD CONSTRAINT "CoopPlayer_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "CoopLobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoopPlayer" ADD CONSTRAINT "CoopPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoopGuess" ADD CONSTRAINT "CoopGuess_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "CoopLobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoopGuess" ADD CONSTRAINT "CoopGuess_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "CoopPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
