-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "simbol" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RadarScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simbol" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scorAnalist" INTEGER NOT NULL,
    "scorMomentum" INTEGER NOT NULL,
    "scorFundamental" INTEGER NOT NULL,
    "scorRisc" INTEGER NOT NULL,
    "scorCompozit" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "rezumat" TEXT NOT NULL,
    "riscuri" TEXT NOT NULL,
    "invalidare" TEXT NOT NULL,
    "incredere" TEXT NOT NULL,
    "sursaDate" TEXT NOT NULL,
    "generatAi" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_simbol_key" ON "Watchlist"("userId", "simbol");

-- CreateIndex
CREATE UNIQUE INDEX "RadarScore_simbol_key" ON "RadarScore"("simbol");
