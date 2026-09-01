-- Brieful personal al watchlist-ului: 1 rand per (utilizator, zi)
CREATE TABLE "BriefPersonal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zi" TEXT NOT NULL,
    "textRo" TEXT NOT NULL,
    "generatAi" BOOLEAN NOT NULL DEFAULT false,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefPersonal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BriefPersonal_userId_zi_key" ON "BriefPersonal"("userId", "zi");
