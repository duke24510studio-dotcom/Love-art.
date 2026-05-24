-- CreateTable
CREATE TABLE "PosterTheme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collection" TEXT NOT NULL,
    "themeJa" TEXT NOT NULL,
    "themeEn" TEXT NOT NULL,
    "verticalTextJa" TEXT NOT NULL,
    "subtitleEn" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL,
    "stylePreset" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'idea',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PosterGeneration" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PosterGeneration_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "PosterTheme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
