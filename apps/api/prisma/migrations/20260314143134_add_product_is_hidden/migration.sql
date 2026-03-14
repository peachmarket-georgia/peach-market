-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "products_isHidden_idx" ON "products"("isHidden");
