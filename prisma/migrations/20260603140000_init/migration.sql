-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "PosterTheme" (
    "id" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "themeJa" TEXT NOT NULL,
    "themeEn" TEXT NOT NULL,
    "verticalTextJa" TEXT NOT NULL,
    "subtitleEn" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL,
    "stylePreset" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'idea',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosterTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosterGeneration" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL DEFAULT '',
    "imagePath" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "qualityScore" INTEGER,
    "qualityComment" TEXT NOT NULL DEFAULT '',
    "etsyTitle" TEXT NOT NULL DEFAULT '',
    "etsyDescription" TEXT NOT NULL DEFAULT '',
    "etsyTags" TEXT NOT NULL DEFAULT '',
    "pinterestCaption" TEXT NOT NULL DEFAULT '',
    "instagramCaption" TEXT NOT NULL DEFAULT '',
    "xCaption" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'idea',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosterGeneration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PosterGeneration" ADD CONSTRAINT "PosterGeneration_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "PosterTheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
