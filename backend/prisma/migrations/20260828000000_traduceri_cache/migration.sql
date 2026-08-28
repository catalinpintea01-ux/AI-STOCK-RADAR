CREATE TABLE "TraducereCache" (
    "cheie" TEXT NOT NULL,
    "limba" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraducereCache_pkey" PRIMARY KEY ("cheie")
);
