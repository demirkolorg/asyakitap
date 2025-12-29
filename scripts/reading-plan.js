require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get all books with their status and reading list info
  const books = await prisma.book.findMany({
    include: {
      author: true,
      readingListBooks: {
        include: {
          level: {
            include: {
              readingList: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get all reading lists
  const readingLists = await prisma.readingList.findMany({
    include: {
      levels: {
        include: {
          books: {
            include: {
              book: {
                include: { author: true }
              }
            },
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { levelNumber: 'asc' }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });

  // Group by status
  const byStatus = {
    COMPLETED: books.filter(b => b.status === 'COMPLETED'),
    READING: books.filter(b => b.status === 'READING'),
    TO_READ: books.filter(b => b.status === 'TO_READ'),
    DNF: books.filter(b => b.status === 'DNF')
  };

  console.log('=== KİTAP İSTATİSTİKLERİ ===');
  console.log('Toplam:', books.length);
  console.log('Okunan:', byStatus.COMPLETED.length);
  console.log('Okunuyor:', byStatus.READING.length);
  console.log('Okunacak:', byStatus.TO_READ.length);
  console.log('Bırakılan:', byStatus.DNF.length);

  // Calculate total pages
  const completedPages = byStatus.COMPLETED.reduce((sum, b) => sum + (b.pageCount || 0), 0);
  const toReadPages = byStatus.TO_READ.reduce((sum, b) => sum + (b.pageCount || 0), 0);
  console.log('\nOkunan toplam sayfa:', completedPages);
  console.log('Okunacak toplam sayfa:', toReadPages);

  console.log('\n=== OKUNAN KİTAPLAR ===');
  byStatus.COMPLETED.forEach(b => {
    console.log(`- ${b.title} (${b.author?.name || 'Bilinmiyor'}) - ${b.pageCount || '?'} sayfa`);
  });

  console.log('\n=== ŞU AN OKUNUYOR ===');
  byStatus.READING.forEach(b => {
    const progress = b.pageCount ? Math.round((b.currentPage / b.pageCount) * 100) : 0;
    console.log(`- ${b.title} (${b.author?.name || 'Bilinmiyor'}) - Sayfa ${b.currentPage}/${b.pageCount || '?'} (%${progress})`);
  });

  console.log('\n=== OKUMA LİSTELERİ ===');
  readingLists.forEach(list => {
    const totalBooks = list.levels.reduce((sum, l) => sum + l.books.length, 0);
    const completedInList = list.levels.reduce((sum, l) => {
      return sum + l.books.filter(lb => lb.book.status === 'COMPLETED').length;
    }, 0);
    console.log(`\n📚 ${list.name} (${completedInList}/${totalBooks} tamamlandı)`);

    list.levels.forEach(level => {
      console.log(`  Level ${level.levelNumber}: ${level.name}`);
      level.books.forEach(lb => {
        const status = lb.book.status === 'COMPLETED' ? '✅' :
                       lb.book.status === 'READING' ? '📖' : '⬜';
        console.log(`    ${status} ${lb.book.title} (${lb.book.author?.name || '?'}) - ${lb.book.pageCount || '?'}s`);
      });
    });
  });

  console.log('\n=== OKUNACAK KİTAPLAR (LİSTEDE OLMAYANLAR) ===');
  const booksInLists = new Set();
  readingLists.forEach(list => {
    list.levels.forEach(level => {
      level.books.forEach(lb => booksInLists.add(lb.book.id));
    });
  });

  const toReadNotInList = byStatus.TO_READ.filter(b => !booksInLists.has(b.id));
  toReadNotInList.forEach(b => {
    console.log(`- ${b.title} (${b.author?.name || 'Bilinmiyor'}) - ${b.pageCount || '?'} sayfa`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
