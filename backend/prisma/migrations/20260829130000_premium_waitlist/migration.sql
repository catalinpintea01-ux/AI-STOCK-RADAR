CREATE TABLE "PremiumWaitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PremiumWaitlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PremiumWaitlist_userId_key" ON "PremiumWaitlist"("userId");

ALTER TABLE "PremiumWaitlist" ADD CONSTRAINT "PremiumWaitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
