-- AlterTable
ALTER TABLE "chat_rooms" ADD COLUMN     "buyerLeftAt" TIMESTAMP(3),
ADD COLUMN     "sellerLeftAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;
