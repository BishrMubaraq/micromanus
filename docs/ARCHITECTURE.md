# MicroManus architecture

See the mermaid diagrams in the root [README.md](../README.md) for the system and database maps.

## Layers

| Layer | Path | Responsibility |
| --- | --- | --- |
| Routes | `app/` | Pages, API routes, layouts |
| Features | `features/` | Domain UI + server actions |
| Services | `services/` | Supabase, credits, payments, chats |
| Lib | `lib/` | Env, billing constants, crypto, security |
| Migrations | `supabase/migrations/` | Schema + RLS + RPCs |

## Trust boundaries

- Browser never receives decrypted provider keys.
- Credit mutations only via `service_role` RPCs.
- Lemon webhook: HMAC verify → `fulfill_lemon_order` (idempotent).
- BYOK endpoints allowlisted; chat POSTs same-origin in production.
