-- Evaluarea zilnica a scorurilor (verdict de acum ~5 zile vs variatia reala)
CREATE TABLE "EvaluareRadar" (
    "id" TEXT NOT NULL,
    "zi" TEXT NOT NULL,
    "simbol" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "scorAtunci" INTEGER NOT NULL,
    "scorMomentumAtunci" INTEGER NOT NULL,
    "scorAnalistAtunci" INTEGER NOT NULL,
    "scorFundamentalAtunci" INTEGER NOT NULL,
    "variatiePct" DOUBLE PRECISION NOT NULL,
    "potrivire" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluareRadar_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EvaluareRadar_zi_simbol_key" ON "EvaluareRadar"("zi", "simbol");
CREATE INDEX "EvaluareRadar_zi_idx" ON "EvaluareRadar"("zi");

-- Ponderile compozitului, ajustate zilnic in limite de siguranta
CREATE TABLE "PonderiRadar" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "wMomentum" INTEGER NOT NULL DEFAULT 30,
    "wAnalist" INTEGER NOT NULL DEFAULT 30,
    "wFundamental" INTEGER NOT NULL DEFAULT 20,
    "wRisc" INTEGER NOT NULL DEFAULT 20,
    "ziUltimaAjustare" TEXT,
    "actualizatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PonderiRadar_pkey" PRIMARY KEY ("id")
);
