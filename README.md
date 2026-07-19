# MicroManus

Premium AI deep-research workspace. Bring your own OpenAI, Anthropic, or Kimi key — MicroManus plans, searches, and streams grounded answers.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Supabase Auth + Postgres
- Vercel AI SDK
- Lemon Squeezy billing

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Apply SQL migrations under `supabase/migrations/` to your Supabase project, then open [http://localhost:3000](http://localhost:3000).

## Shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Command menu |
| `N` | New research |
| `A` | Analytics |
| `S` | Settings |
| `B` | Billing |
| `Enter` | Send research prompt |
| `Shift+Enter` | Newline in composer |

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
