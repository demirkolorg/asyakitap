# AsyaKitap

**Kişisel kitaplık ve okuma takibi uygulaması** · Personal library & reading tracker

AsyaKitap is a Next.js web application for organizing books and reading activity. Its landing page presents personal shelves, reading lists, quotes, reading goals and statistics.

> **Project status:** Active development. This README documents the repository structure and available implementation, not a production-service guarantee.

## Özellikler / Features

- Kişisel kütüphane ve kitap rafları / Personal library and shelves
- Okuma listeleri, hedefler ve ilerleme görünümü / Reading lists, goals and progress views
- Kitap, yazar ve yayınevi ekranları / Book, author and publisher pages
- Alıntı, özet ve okuma zamanlayıcısı ekranları / Quotes, summaries and reading timer
- Google ile giriş için Supabase Auth akışı / Supabase Auth Google sign-in flow
- Yönetim paneli ve ek modüller / Dashboard and additional modules

> Listed modules are visible in the source tree; their complete production readiness has not been independently tested.

## Teknolojiler

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Prisma · Supabase · TipTap

## Yerelde çalıştırma / Local development

```bash
git clone https://github.com/demirkolorg/asyakitap.git
cd asyakitap
npm ci
npm run dev
```

Geliştirme sunucusu: **http://localhost:5000** (package.json içindeki `dev` komutu).

The project uses database and authentication services. Create a local environment file using the repository's placeholder template:

```bash
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead. Set `DATABASE_URL` (PostgreSQL connection string), `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for your own services. The Supabase anon key is designed for client-side use; never put a service-role secret in a `NEXT_PUBLIC_*` variable. Do not commit real credentials. A full one-command database bootstrap is not yet documented.

```bash
npm run lint
npm run build
```

## Kod yapısı / Codebase

| Path | Responsibility |
| --- | --- |
| `app/` | App Router routes, dashboard and auth pages |
| `components/` | Reusable UI components |
| `lib/` | Shared helpers and integrations |
| `prisma/` | Database schema and seed scripts |
| `actions/` | Server-side actions |
| `docs/` | Additional project documentation |

## Ekran görüntüleri / Screenshots

Screenshots will be added after real application screens are captured. No mockup is presented as a verified product screenshot.

## Notlar / Notes

- Project is under development; verify authentication, migrations and permissions before deployment.
- This repository does not currently document a complete automated test suite.
- See `package.json` for available commands and dependency versions.
