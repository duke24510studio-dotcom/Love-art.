-- CreateTable
CREATE TABLE "VideoProject" (
    "id" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "targetAudience" TEXT NOT NULL DEFAULT 'US/UK/CA/AU viewers aged 30-50',
    "durationTargetMin" INTEGER NOT NULL DEFAULT 10,
    "voice" TEXT NOT NULL DEFAULT 'onyx',
    "hook" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "thumbnailText" TEXT NOT NULL DEFAULT '',
    "thumbnailPrompt" TEXT NOT NULL DEFAULT '',
    "thumbnailPath" TEXT NOT NULL DEFAULT '',
    "videoPath" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'idea',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoScene" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "heading" TEXT NOT NULL DEFAULT '',
    "narration" TEXT NOT NULL DEFAULT '',
    "visualPrompt" TEXT NOT NULL DEFAULT '',
    "imagePath" TEXT NOT NULL DEFAULT '',
    "audioPath" TEXT NOT NULL DEFAULT '',
    "durationSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoScene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoScene_projectId_order_idx" ON "VideoScene"("projectId", "order");

-- AddForeignKey
ALTER TABLE "VideoScene" ADD CONSTRAINT "VideoScene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
