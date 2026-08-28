CREATE TABLE "Narativa" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "simbol" TEXT NOT NULL,
    "teza" TEXT NOT NULL,
    "scorInitial" INTEGER,
    "momentumInitial" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Narativa_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Narativa_userId_simbol_key" ON "Narativa"("userId", "simbol");
