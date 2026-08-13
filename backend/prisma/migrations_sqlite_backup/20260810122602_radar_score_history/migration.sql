-- CreateTable
CREATE TABLE "RadarScoreHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simbol" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scorAnalist" INTEGER NOT NULL,
    "scorMomentum" INTEGER NOT NULL,
    "scorFundamental" INTEGER NOT NULL,
    "scorRisc" INTEGER NOT NULL,
    "scorCompozit" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "RadarScoreHistory_simbol_computedAt_idx" ON "RadarScoreHistory"("simbol", "computedAt");
