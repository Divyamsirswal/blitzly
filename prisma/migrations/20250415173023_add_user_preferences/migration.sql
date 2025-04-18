/*
  Warnings:

  - A unique constraint covering the columns `[apiKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "preferences" JSONB DEFAULT '{"theme":"system","emailNotifications":true,"shareAnalytics":false}';

-- CreateIndex
CREATE UNIQUE INDEX "User_apiKey_key" ON "User"("apiKey");
