/*
  Warnings:

  - You are about to drop the column `progress` on the `Module` table. All the data in the column will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "progress";
