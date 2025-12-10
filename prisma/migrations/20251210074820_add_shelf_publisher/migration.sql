-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "publisherId" TEXT,
ADD COLUMN     "shelfId" TEXT;

-- CreateTable
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shelf" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shelf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Publisher_name_idx" ON "Publisher"("name");

-- CreateIndex
CREATE INDEX "Shelf_userId_idx" ON "Shelf"("userId");

-- CreateIndex
CREATE INDEX "Shelf_userId_sortOrder_idx" ON "Shelf"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "Book_publisherId_idx" ON "Book"("publisherId");

-- CreateIndex
CREATE INDEX "Book_shelfId_idx" ON "Book"("shelfId");

-- CreateIndex
CREATE INDEX "Book_userId_status_idx" ON "Book"("userId", "status");

-- CreateIndex
CREATE INDEX "Book_userId_updatedAt_idx" ON "Book"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Quote_bookId_createdAt_idx" ON "Quote"("bookId", "createdAt");

-- CreateIndex
CREATE INDEX "ReadingLog_bookId_createdAt_idx" ON "ReadingLog"("bookId", "createdAt");

-- AddForeignKey
ALTER TABLE "Shelf" ADD CONSTRAINT "Shelf_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;
