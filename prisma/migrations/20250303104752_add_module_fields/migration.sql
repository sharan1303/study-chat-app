-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "icon" TEXT NOT NULL DEFAULT '📚',
ADD COLUMN     "lastStudied" TIMESTAMP(3),
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0;
