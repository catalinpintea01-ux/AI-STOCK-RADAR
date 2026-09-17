-- Palnia de conversie masurata de noi (evenimente anonime)
CREATE TABLE "Eveniment" (
    "id" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "simbol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Eveniment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Eveniment_tip_createdAt_idx" ON "Eveniment"("tip", "createdAt");
