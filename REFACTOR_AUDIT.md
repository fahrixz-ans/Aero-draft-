# Mod Station — Architectural & Codebase Audit Report

## 1. Executive Summary & Objectives
Mod Station is undergoing a comprehensive architectural overhaul and security hardening to transform the legacy draft codebase into a lean, secure, and production-ready Android APK discovery and catalog platform.

The architectural rebuild establishes:
1. **Light Theme Only**: Complete removal of dark mode mechanisms, toggles, classes, and theme persistence.
2. **Branding**: Uniform "Mod Station" branding across all UI, metadata, SEO, and services.
3. **Database**: Cloud Firestore as the single source of truth for all persistent entities.
4. **Authentication**: Firebase Authentication with server-side Firebase ID Token verification via Firebase Admin SDK.
5. **APK Distribution**: Direct/external download URLs and external image URLs without internal binary hosting, parsing, or fake security scanning.
6. **Worker Architecture**: Firestore-backed idempotent background jobs for AI generation, SEO indexing, and analytics rollup.
7. **Module Elimination**: Complete deprecation and removal of customer service modules, legacy APK analyzers, and obsolete session adapters.

---

## 2. Legacy Module & Debt Inventory

| Category | Legacy Implementation | Target Architecture | Action |
| :--- | :--- | :--- | :--- |
| **Theme** | Dark mode classes, theme toggle, localStorage theme | Light Theme Only (`bg-slate-50`, `bg-white`, clean slate text) | Purge dark mode toggles & styles |
| **Auth** | Auth.js, custom session tokens, `x-user-email` header trust | Firebase Auth ID Token verification via Admin SDK | Replace with Firebase Auth |
| **Database** | Fallback in-memory arrays mixed with Firestore | Production Cloud Firestore queries with clean models | Enforce Firestore schema |
| **APK Storage** | Local filesystem `/uploads/apks`, R2 storage mock | External APK Download URLs (`downloadUrl`) | Remove file uploaders & binary storage |
| **APK Analyzer** | Manifest parsing, permission extraction, fake VT scan | Explicit admin metadata input | Remove analyzer pipelines |
| **Customer Service**| Support chat, live agent queues, ticket claiming | Not needed in Mod Station scope | Complete removal |
| **Admin Panel** | Monolithic dashboard with obsolete APK analyzers | Modern modular Admin Panel matching public website | Rebuild admin pages |
| **Workers** | In-memory job queues mixed with APK tasks | Firestore collection `aiJobs` / `systemJobs` with retry | Rebuild worker system |
| **SEO & Sitemap** | Hardcoded category URLs and mock sitemaps | Dynamic XML sitemaps & Schema.org JSON-LD | Update sitemaps & metadata |

---

## 3. Data Model & Collections Plan
- `users`: User profiles, roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `MODERATOR`, `DEVELOPER`, `USER`), permissions.
- `applications`: App catalog (name, slug, category, developer, iconUrl, bannerUrl, screenshotUrls, downloadUrl, size, versionName, versionCode, status, metrics).
- `appVersions`: Version history for each application with changelogs and external download URLs.
- `categories`: Canonical 100 Indonesian app categories with sort order and status.
- `collections`: Curated homepage and category collections.
- `reviews`: User feedback and star ratings.
- `analyticsEvents`: Tracked download clicks, app views, category views, and searches.
- `aiJobs`: Persistent async background jobs for AI content synthesis and SEO.
- `adminLogs`: Audit trails for administrative actions.
- `settings`: Global site settings, feature flags, and maintenance switches.

---

## 4. Phased Execution Roadmap
- **Phase 1**: Full Audit & Plan Documentation (Completed).
- **Phase 2**: Purge legacy modules (Customer Service, APK Storage/Analyzer, Dark Mode).
- **Phase 3**: Core Firebase Auth & Admin SDK ID Token verification.
- **Phase 4**: Public frontend polish (Light theme enforcement, external URL download links).
- **Phase 5**: Rebuilt Admin Panel with URL inputs, responsive tables, and clean forms.
- **Phase 6**: Firestore-backed resilient worker engine.
- **Phase 7**: Server-side Gemini AI features with rate-limiting.
- **Phase 8**: Production-grade `firestore.rules` with strict RBAC.
- **Phase 9**: SEO, sitemaps, robots.txt, Open Graph, and Structured Data.
- **Phase 10**: Vercel & serverless deployment configuration.
- **Phase 11**: Full test suite validation & zero-error compilation.
- **Phase 12**: Final verification, QA Report (`QA_REPORT.md`), and updated `README.md`.
