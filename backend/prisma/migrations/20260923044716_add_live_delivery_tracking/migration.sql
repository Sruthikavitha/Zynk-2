-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION,
ADD COLUMN     "deliveryLatitude" DOUBLE PRECISION,
ADD COLUMN     "deliveryLongitude" DOUBLE PRECISION,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3),
ADD COLUMN     "pickupLatitude" DOUBLE PRECISION,
ADD COLUMN     "pickupLongitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "DeliveryPartner" ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DeliveryLocation" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "deliveryPartnerId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryLocation_deliveryId_createdAt_idx" ON "DeliveryLocation"("deliveryId", "createdAt");

-- AddForeignKey
ALTER TABLE "DeliveryLocation" ADD CONSTRAINT "DeliveryLocation_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryLocation" ADD CONSTRAINT "DeliveryLocation_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "DeliveryPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
