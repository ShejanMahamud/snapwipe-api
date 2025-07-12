/*
  Warnings:

  - You are about to drop the column `value` on the `benefits` table. All the data in the column will be lost.
  - Added the required column `slug` to the `benefits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `plan_benefits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "benefits" DROP COLUMN "value",
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "plan_benefits" ADD COLUMN     "value" TEXT NOT NULL;
