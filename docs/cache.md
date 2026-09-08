# AERO APK — Centralized Cache Architecture

## Caching Strategy
AERO implements a multi-tier caching model managed via `server/config/cache.ts`:

- **L1 Cache**: In-Memory micro-cache per instance.
- **L2 Cache**: Shared application cache configured with TTL and Stale-While-Revalidate headers.

## Route Cache Matrix

| Domain | Key Prefix | TTL (Seconds) | Personalized | Security Sensitive | Invalidation Events |
|---|---|---|---|---|---|
| App Catalog | `aero:apps` | 300 | No | No | `app.updated`, `app.published` |
| App Detail | `aero:app-detail` | 300 | No | No | `app.updated`, `version.published` |
| Search | `aero:search` | 60 | No | No | `search-index.updated` |
| Recommendations | `aero:recommendation` | 300 | Yes | No | `user.preference.updated` |
| Security/Admin | `aero:security` | 0 (Bypass) | Yes | Yes | Immediate bypass |

## Security Rules
- Personalized route caches include `userId` in the cache key.
- Admin and security-critical endpoints bypass shared cache entirely.
