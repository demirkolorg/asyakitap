-- CreateTable
CREATE TABLE "ReadingList" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingListLevel" (
    "id" TEXT NOT NULL,
    "readingListId" TEXT NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingListLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingListBook" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "neden" TEXT,
    "pageCount" INTEGER,
    "coverUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingListBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReadingListBook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readingListBookId" TEXT NOT NULL,
    "bookId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReadingListBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingList_slug_key" ON "ReadingList"("slug");

-- CreateIndex
CREATE INDEX "ReadingListLevel_readingListId_idx" ON "ReadingListLevel"("readingListId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingListLevel_readingListId_levelNumber_key" ON "ReadingListLevel"("readingListId", "levelNumber");

-- CreateIndex
CREATE INDEX "ReadingListBook_levelId_idx" ON "ReadingListBook"("levelId");

-- CreateIndex
CREATE INDEX "UserReadingListBook_userId_idx" ON "UserReadingListBook"("userId");

-- CreateIndex
CREATE INDEX "UserReadingListBook_readingListBookId_idx" ON "UserReadingListBook"("readingListBookId");

-- CreateIndex
CREATE INDEX "UserReadingListBook_bookId_idx" ON "UserReadingListBook"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReadingListBook_userId_readingListBookId_key" ON "UserReadingListBook"("userId", "readingListBookId");

-- AddForeignKey
ALTER TABLE "ReadingListLevel" ADD CONSTRAINT "ReadingListLevel_readingListId_fkey" FOREIGN KEY ("readingListId") REFERENCES "ReadingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingListBook" ADD CONSTRAINT "ReadingListBook_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "ReadingListLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadingListBook" ADD CONSTRAINT "UserReadingListBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadingListBook" ADD CONSTRAINT "UserReadingListBook_readingListBookId_fkey" FOREIGN KEY ("readingListBookId") REFERENCES "ReadingListBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadingListBook" ADD CONSTRAINT "UserReadingListBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
