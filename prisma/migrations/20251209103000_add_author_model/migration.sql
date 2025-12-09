-- CreateTable: Author
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Author_name_idx" ON "Author"("name");

-- Step 1: Add new columns to Book
ALTER TABLE "Book" ADD COLUMN "authorId" TEXT;
ALTER TABLE "Book" ADD COLUMN "imza" TEXT;

-- Step 3: Create Author records from unique author names
INSERT INTO "Author" ("id", "name", "updatedAt")
SELECT
    gen_random_uuid()::TEXT,
    "author",
    CURRENT_TIMESTAMP
FROM "Book"
WHERE "author" IS NOT NULL
GROUP BY "author";

-- Step 4: Link books to their authors
UPDATE "Book" b
SET "authorId" = a."id"
FROM "Author" a
WHERE b."author" = a."name";

-- Step 5: Drop old author column
ALTER TABLE "Book" DROP COLUMN "author";

-- Step 6: Create index on authorId
CREATE INDEX "Book_authorId_idx" ON "Book"("authorId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;
