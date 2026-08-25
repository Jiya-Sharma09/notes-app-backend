/*
  Warnings:

  - Added the required column `purpose` to the `OtpAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `OtpToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OtpAttempt_userId_createdAt_idx";

-- DropIndex
DROP INDEX "OtpToken_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "OtpAttempt" ADD COLUMN     "purpose" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OtpToken" ADD COLUMN     "purpose" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "OtpAttempt_userId_purpose_createdAt_idx" ON "OtpAttempt"("userId", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "OtpToken_userId_purpose_createdAt_idx" ON "OtpToken"("userId", "purpose", "createdAt");
