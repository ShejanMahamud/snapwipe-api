-- CreateEnum
CREATE TYPE "UsageHistoryAction" AS ENUM ('bg_remover', 'image_upscaler');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "BenefitValue";

-- CreateTable
CREATE TABLE "usage_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "action" "UsageHistoryAction" NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_history_userId_createdAt_idx" ON "usage_history"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "usage_history" ADD CONSTRAINT "usage_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_history" ADD CONSTRAINT "usage_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
