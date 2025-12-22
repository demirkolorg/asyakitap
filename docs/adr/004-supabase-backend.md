# ADR-004: Supabase Backend

## Durum
Kabul

## Bağlam
Authentication ve veritabanı hosting için bir backend servis seçilmeliydi:
- Self-hosted PostgreSQL + Custom Auth
- Firebase
- AWS Amplify
- Supabase
- PlanetScale + Clerk

## Karar
**Supabase** kullanmaya karar verdik.

### Gerekçe
1. **PostgreSQL:** Gerçek PostgreSQL veritabanı
2. **Built-in Auth:** Email, OAuth, Magic Link desteği
3. **Free Tier:** Yeterli ücretsiz kaynak
4. **Row Level Security:** Veritabanı seviyesinde güvenlik
5. **Realtime:** WebSocket desteği (gelecekte kullanılabilir)

## Sonuçlar

### Olumlu
- Kolay kurulum
- Dashboard ile veritabanı yönetimi
- Automatic backups
- Connection pooling (Supavisor)
- Prisma ile tam uyumluluk

### Olumsuz
- Vendor lock-in riski
- Cold start (free tier)
- Bölgesel kısıtlamalar

## Uygulama

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```
