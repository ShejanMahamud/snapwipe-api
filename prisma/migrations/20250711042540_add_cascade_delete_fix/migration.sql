-- DropForeignKey
ALTER TABLE "plan_benefits" DROP CONSTRAINT "plan_benefits_benefitId_fkey";

-- DropForeignKey
ALTER TABLE "plan_benefits" DROP CONSTRAINT "plan_benefits_planId_fkey";

-- AddForeignKey
ALTER TABLE "plan_benefits" ADD CONSTRAINT "plan_benefits_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_benefits" ADD CONSTRAINT "plan_benefits_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "benefits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
