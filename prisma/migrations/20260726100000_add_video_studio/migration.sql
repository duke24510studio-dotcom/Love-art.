-- AlterTable: multi-genre note channel + humanize passes
ALTER TABLE "Article" ADD COLUMN "genre" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Article" ADD COLUMN "rawBody" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Article" ADD COLUMN "humanizeLog" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "VideoProject" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "format" TEXT NOT NULL DEFAULT 'long',
    "visualStyle" TEXT NOT NULL DEFAULT 'japandi',
    "voice" TEXT NOT NULL DEFAULT 'alloy',
    "genre" TEXT NOT NULL DEFAULT '',
    "topic" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "hook" TEXT NOT NULL DEFAULT '',
    "chapters" TEXT NOT NULL DEFAULT '',
    "thumbnailText" TEXT NOT NULL DEFAULT '',
    "thumbnailPrompt" TEXT NOT NULL DEFAULT '',
    "thumbnailPath" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoScene" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "heading" TEXT NOT NULL DEFAULT '',
    "narration" TEXT NOT NULL DEFAULT '',
    "onScreenText" TEXT NOT NULL DEFAULT '',
    "imagePrompt" TEXT NOT NULL DEFAULT '',
    "imagePath" TEXT NOT NULL DEFAULT '',
    "audioPath" TEXT NOT NULL DEFAULT '',
    "audioSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seconds" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoScene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoScene_projectId_index_key" ON "VideoScene"("projectId", "index");

-- AddForeignKey
ALTER TABLE "VideoProject" ADD CONSTRAINT "VideoProject_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoScene" ADD CONSTRAINT "VideoScene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
