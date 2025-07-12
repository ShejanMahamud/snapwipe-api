/*
  Warnings:

  - You are about to drop the column `slug` on the `benefits` table. All the data in the column will be lost.
  - Added the required column `value` to the `benefits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "benefits" DROP COLUMN "slug",
ADD COLUMN     "value" TEXT NOT NULL;
