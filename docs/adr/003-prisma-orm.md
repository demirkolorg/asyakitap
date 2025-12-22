# ADR-003: Prisma ORM Seçimi

## Durum
Kabul

## Bağlam
PostgreSQL veritabanı ile iletişim için bir ORM/query builder seçilmeliydi:
- Raw SQL
- Knex.js (Query Builder)
- TypeORM
- Drizzle ORM
- Prisma ORM

## Karar
**Prisma ORM** kullanmaya karar verdik.

### Gerekçe
1. **Schema-first approach:** Declarative schema tanımı
2. **Type generation:** Otomatik TypeScript tipleri
3. **Migrations:** Kolay veritabanı migration'ları
4. **Prisma Studio:** Visual database browser
5. **Relations:** Kolay ilişki yönetimi

## Sonuçlar

### Olumlu
- IntelliSense ve autocomplete desteği
- Compile-time type checking
- Schema değişikliklerinde otomatik tip güncelleme
- Include/select ile kolay eager loading

### Olumsuz
- Cold start süresi (serverless ortamda)
- Karmaşık sorgularda raw SQL gerekebilir
- Bundle size

## Uygulama

```prisma
// prisma/schema.prisma
model Book {
  id       String   @id @default(cuid())
  title    String
  author   Author?  @relation(fields: [authorId], references: [id])
  authorId String?

  @@index([authorId])
}
```

```typescript
// Tip-güvenli sorgu
const books = await prisma.book.findMany({
  where: { userId },
  include: { author: true, publisher: true }
})
// books tipi otomatik olarak: (Book & { author: Author | null, publisher: Publisher | null })[]
```
