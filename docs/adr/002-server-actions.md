# ADR-002: Server Actions ile API

## Durum
Kabul

## Bağlam
Backend işlemleri için bir API stratejisi belirlenmesi gerekiyordu:
- REST API (API Routes)
- GraphQL
- tRPC
- Server Actions

## Karar
**Server Actions** kullanmaya karar verdik.

### Gerekçe
1. **Type Safety:** TypeScript ile end-to-end type safety
2. **Basitlik:** Ayrı API layer'ı yok
3. **Colocation:** İlgili kodlar bir arada
4. **Progressive Enhancement:** JavaScript olmadan da çalışabilir
5. **Optimistic Updates:** UI'ın anında güncellenmesi

## Sonuçlar

### Olumlu
- Daha az boilerplate kod
- Otomatik form handling
- Revalidation ile kolay cache invalidation
- Direkt veritabanı erişimi (Prisma)

### Olumsuz
- Public API sağlanmıyor (mobil uygulama için sorun olabilir)
- Debugging biraz daha zor
- Rate limiting manuel yapılmalı

## Uygulama

```typescript
// actions/library.ts
"use server"

export async function addBook(data: BookInput) {
  const { userId } = await getSession()

  return prisma.book.create({
    data: { ...data, userId }
  })
}
```
