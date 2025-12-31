-- CreateTable
CREATE TABLE "NinTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "templateContent" TEXT NOT NULL,
    "placeholders" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NinTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NinTemplate_type_isActive_idx" ON "NinTemplate"("type", "isActive");
