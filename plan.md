# Prettiflow Analyzer Implementation Plan

## Overview
Build the analyzer as a Next.js 16 app in `/workspace/frontend` with root-level `app`, `components`, and `lib` structure, Tailwind v4 styling, Radix UI primitives, Recharts visualizations, Drizzle schema, and Vercel-ready Next route handlers for the requested API. Keep `/workspace/backend` aligned with the same Drizzle schema as an Express template, but expose `/api/analyze`, `/api/recent`, and `/api/result` from Next.js route handlers for deployment simplicity. Implement custom email/password auth using hashed passwords and JWT/session cookie helpers. Add `is_public` to analyses so user-owned analyses can appear in public feeds when desired.

## Key Files to Change / Add
- `frontend/app/layout.tsx` — global shell, metadata, background gradient orbs.
- `frontend/app/globals.css` — Tailwind v4 theme tokens, brand colors, animations.
- `frontend/app/page.tsx` — homepage analyzer form and recent analyses feed.
- `frontend/app/r/[id]/page.tsx` — result scorecard page.
- `frontend/app/dashboard/page.tsx` — authenticated saved analyses dashboard.
- `frontend/app/explore/page.tsx` — public leaderboard/feed with filters and charts.
- `frontend/app/api/analyze/route.ts` — fixed demo analyzer stub that persists an analysis.
- `frontend/app/api/recent/route.ts` — last 20 public analyses.
- `frontend/app/api/result/route.ts` — single analysis by `id`.
- `frontend/app/api/auth/signup/route.ts`, `frontend/app/api/auth/login/route.ts`, `frontend/app/api/auth/logout/route.ts`, `frontend/app/api/auth/me/route.ts` — custom auth endpoints.
- `frontend/lib/db/schema.ts` — Drizzle `users` and `analyses` tables, including `password_hash` for auth and `is_public` for public visibility.
- `frontend/lib/db/index.ts` — Drizzle client using env-based Postgres URL (`DATABASE_URL`, with Supabase/Neon-compatible connection string).
- `frontend/lib/auth.ts` — password hashing, JWT/cookie helpers, current user lookup.
- `frontend/lib/analyzer-placeholder.ts` — fixed demo result payload matching UI requirements.
- `frontend/lib/types.ts` — shared result/analysis types.
- `frontend/components/*` — score ring, dimension cards, score bars, badges, analysis cards, charts, auth forms, tabs/forms, layout/nav.
- `backend/src/lib/schema.js` or existing backend schema file — mirror Drizzle schema for Express backend consistency.
- `backend/drizzle.config.js` and `frontend/drizzle.config.ts` — point to env-based Postgres URL.
- `frontend/.env.example`, `backend/.env.example` — document `DATABASE_URL`, `JWT_SECRET`, and public app URL vars.

## Main Implementation Steps
1. **Database + environment**
   - Define Drizzle tables: `users(id, email, name, password_hash, created_at)` and `analyses(id, user_id nullable, app_name, input, input_type enum, result jsonb, provider, complexity_label, overall_complexity int, is_public boolean, created_at)`.
   - Add indexes for `created_at`, `user_id`, `is_public`, and `complexity_label`.
   - Configure DB client with `DATABASE_URL`, supporting either Supabase Postgres or Neon via standard connection string.

2. **Auth foundation**
   - Implement signup/login/logout/me route handlers.
   - Hash passwords server-side, set an HTTP-only cookie containing a signed JWT/session token, and expose current user helpers for dashboard/API ownership.
   - Build simple login/signup UI or modal/page components as needed for dashboard access.

3. **API route stubs**
   - `POST /api/analyze`: validate `{ input, inputType }`, derive a demo `app_name`, attach current user if logged in, persist a fixed demo scorecard result, set `provider: "placeholder"`, and return `{ result, provider, id }`.
   - `GET /api/recent`: return last 20 rows where `is_public = true`, newest first.
   - `GET /api/result?id=`: return one analysis by id, allowing public rows or rows owned by the current user.

4. **Shared analyzer data model**
   - Shape `result` to include six dimensions, handle status (`full | partial | manual`), handled/manual lists, time comparison, verdict, stack categories, and chart-friendly metadata.
   - Ensure UI gracefully handles future AI-generated results with the same schema.

5. **Homepage**
   - Build branded hero with headline “Will Prettiflow handle your app?”, Radix tabs for App Description / GitHub Repo, textarea/input, and CTA.
   - On submit, call `/api/analyze`, show loading state, then navigate to `/r/[id]`.
   - Fetch and display recent public analyses below.

6. **Result page**
   - Fetch by id from `/api/result` or directly via server DB helper.
   - Render complexity badge, animated SVG score ring, six dimension cards with animated bars, green/red handled vs manual columns, time comparison, verdict, and “Build this with Prettiflow” CTA.

7. **Dashboard**
   - Require authentication; redirect or show login prompt if unauthenticated.
   - Show user analyses in sortable card grid by date/complexity.
   - Compute stats: total analyzed, average complexity, most common complexity label.

8. **Explore / leaderboard**
   - Display all public analyses with complexity label filters.
   - Add Recharts pie chart for complexity distribution and bar chart for top stack categories from result metadata.

9. **Design system and animations**
   - Apply off-white background `#f9f8f8`, pink `#F67AB6`, blue `#84b9ef`, gradient CTAs, rounded cards, subtle blurred drifting orbs, and clean typography.
   - Use client components for animated score ring and score bars on mount/scroll.

10. **Deploy readiness**
   - Keep API route handlers serverless-compatible for Vercel.
   - Add `.env.example` docs and scripts for `npm`.
   - Avoid hard-coded local URLs; use relative API calls in the frontend.
