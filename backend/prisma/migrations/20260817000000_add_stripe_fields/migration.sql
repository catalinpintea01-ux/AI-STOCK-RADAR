-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
