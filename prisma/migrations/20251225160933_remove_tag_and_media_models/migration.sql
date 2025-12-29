/*
  Warnings:

  - You are about to drop the column `featuredImageId` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the `_ArticleMedia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArticleToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_MatchHighlights` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PlayerPhotos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProductImages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContentCategory" ADD VALUE 'PRESEASON';
ALTER TYPE "ContentCategory" ADD VALUE 'COACH';
ALTER TYPE "ContentCategory" ADD VALUE 'CLUB_UPDATE';
ALTER TYPE "ContentCategory" ADD VALUE 'COMMUNITY_OUTREACH';
ALTER TYPE "ContentCategory" ADD VALUE 'PLAYER_PROFILE';

-- DropForeignKey
ALTER TABLE "_ArticleMedia" DROP CONSTRAINT "_ArticleMedia_A_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleMedia" DROP CONSTRAINT "_ArticleMedia_B_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleToTag" DROP CONSTRAINT "_ArticleToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleToTag" DROP CONSTRAINT "_ArticleToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_MatchHighlights" DROP CONSTRAINT "_MatchHighlights_A_fkey";

-- DropForeignKey
ALTER TABLE "_MatchHighlights" DROP CONSTRAINT "_MatchHighlights_B_fkey";

-- DropForeignKey
ALTER TABLE "_PlayerPhotos" DROP CONSTRAINT "_PlayerPhotos_A_fkey";

-- DropForeignKey
ALTER TABLE "_PlayerPhotos" DROP CONSTRAINT "_PlayerPhotos_B_fkey";

-- DropForeignKey
ALTER TABLE "_ProductImages" DROP CONSTRAINT "_ProductImages_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductImages" DROP CONSTRAINT "_ProductImages_B_fkey";

-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_featuredImageId_fkey";

-- AlterTable
ALTER TABLE "articles" DROP COLUMN "featuredImageId",
ADD COLUMN     "featuredImageUrl" TEXT,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "highlightUrls" TEXT[];

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "photoUrls" TEXT[];

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "imageUrls" TEXT[];

-- DropTable
DROP TABLE "_ArticleMedia";

-- DropTable
DROP TABLE "_ArticleToTag";

-- DropTable
DROP TABLE "_MatchHighlights";

-- DropTable
DROP TABLE "_PlayerPhotos";

-- DropTable
DROP TABLE "_ProductImages";

-- DropTable
DROP TABLE "media";

-- DropTable
DROP TABLE "tags";

-- DropEnum
DROP TYPE "MediaType";
