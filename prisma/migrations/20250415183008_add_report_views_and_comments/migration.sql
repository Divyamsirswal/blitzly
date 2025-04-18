/*
  Warnings:

  - You are about to drop the column `shareUrl` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Report` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shareToken]` on the table `Report` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authorId` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- DropIndex
DROP INDEX "Report_shareUrl_key";

-- First add the new column as nullable
ALTER TABLE "Report" ADD COLUMN "authorId" TEXT;

-- Copy data from userId to authorId
UPDATE "Report" SET "authorId" = "userId";

-- Now make the column required
ALTER TABLE "Report" ALTER COLUMN "authorId" SET NOT NULL;

-- Then proceed with other changes
ALTER TABLE "Report" 
    DROP COLUMN "shareUrl",
    DROP COLUMN "status",
    DROP COLUMN "userId",
    ADD COLUMN "shareSettings" JSONB,
    ADD COLUMN "shareToken" TEXT,
    ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0,
    ALTER COLUMN "content" DROP NOT NULL,
    ALTER COLUMN "content" SET DATA TYPE TEXT,
    ALTER COLUMN "metrics" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_reportId_idx" ON "Comment"("reportId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_shareToken_key" ON "Report"("shareToken");

-- CreateIndex
CREATE INDEX "Report_authorId_idx" ON "Report"("authorId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
