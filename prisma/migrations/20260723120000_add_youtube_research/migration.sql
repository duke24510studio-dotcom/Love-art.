-- CreateTable
CREATE TABLE "YtVideoSnapshot" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL DEFAULT 'ALL',
    "title" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "thumbnailUrl" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "vph" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YtVideoSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YtChannelSnapshot" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "thumbnailUrl" TEXT NOT NULL DEFAULT '',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YtChannelSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelIdea" (
    "id" TEXT NOT NULL,
    "sourceVideoId" TEXT,
    "sourceChannelId" TEXT NOT NULL DEFAULT '',
    "sourceRegion" TEXT NOT NULL DEFAULT '',
    "niche" TEXT NOT NULL DEFAULT '',
    "channelName" TEXT NOT NULL DEFAULT '',
    "concept" TEXT NOT NULL DEFAULT '',
    "targetAudience" TEXT NOT NULL DEFAULT '',
    "contentPillars" TEXT NOT NULL DEFAULT '',
    "sampleTitles" TEXT NOT NULL DEFAULT '',
    "postingCadence" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'idea',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelIdea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YtVideoSnapshot_videoId_idx" ON "YtVideoSnapshot"("videoId");

-- CreateIndex
CREATE INDEX "YtVideoSnapshot_regionCode_fetchedAt_idx" ON "YtVideoSnapshot"("regionCode", "fetchedAt");

-- CreateIndex
CREATE INDEX "YtVideoSnapshot_channelId_idx" ON "YtVideoSnapshot"("channelId");

-- CreateIndex
CREATE INDEX "YtChannelSnapshot_channelId_fetchedAt_idx" ON "YtChannelSnapshot"("channelId", "fetchedAt");

-- AddForeignKey
ALTER TABLE "ChannelIdea" ADD CONSTRAINT "ChannelIdea_sourceVideoId_fkey" FOREIGN KEY ("sourceVideoId") REFERENCES "YtVideoSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
