-- AlterTable
ALTER TABLE "Chef" ADD COLUMN     "address" TEXT,
ADD COLUMN     "area" TEXT,
ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Coimbatore',
ADD COLUMN     "cuisine" TEXT,
ADD COLUMN     "district" TEXT NOT NULL DEFAULT 'Coimbatore',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 4.8,
ADD COLUMN     "serviceAreas" TEXT;
