-- CreateTable
CREATE TABLE "PosterMockup" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "imagePath" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosterMockup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PosterMockup_generationId_scene_key" ON "PosterMockup"("generationId", "scene");

-- AddForeignKey
ALTER TABLE "PosterMockup" ADD CONSTRAINT "PosterMockup_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "PosterGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
