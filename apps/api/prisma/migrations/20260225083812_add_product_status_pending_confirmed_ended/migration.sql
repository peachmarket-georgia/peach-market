-- Replace ProductStatus enum: remove SOLD, add PENDING / CONFIRMED / ENDED

-- Step 1: Create new enum with updated values
CREATE TYPE "ProductStatus_new" AS ENUM ('PENDING', 'SELLING', 'RESERVED', 'CONFIRMED', 'ENDED');

-- Step 2: Drop existing default so column type can be altered
ALTER TABLE "products" ALTER COLUMN "status" DROP DEFAULT;

-- Step 3: Alter column to use new enum (SOLD → ENDED fallback via CASE)
ALTER TABLE "products"
  ALTER COLUMN "status" TYPE "ProductStatus_new"
  USING (
    CASE "status"::text
      WHEN 'SOLD' THEN 'ENDED'::"ProductStatus_new"
      ELSE "status"::text::"ProductStatus_new"
    END
  );

-- Step 4: Restore default using new enum
ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'SELLING'::"ProductStatus_new";

-- Step 5: Drop old enum
DROP TYPE "ProductStatus";

-- Step 6: Rename new enum to original name
ALTER TYPE "ProductStatus_new" RENAME TO "ProductStatus";
