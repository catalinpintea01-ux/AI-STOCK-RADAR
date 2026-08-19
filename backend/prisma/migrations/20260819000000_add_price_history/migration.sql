-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "simbol" TEXT NOT NULL,
    "ziua" TIMESTAMP(3) NOT NULL,
    "pret" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_simbol_ziua_key" ON "PriceHistory"("simbol", "ziua");
