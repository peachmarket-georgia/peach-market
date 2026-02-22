-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ZELLE', 'VENMO');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "paymentMethods" "PaymentMethod"[] DEFAULT ARRAY[]::"PaymentMethod"[];
