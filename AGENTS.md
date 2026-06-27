<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# sans

Next.js 16 (App Router, TypeScript, `src/` dir) + Tailwind CSS v4 + shadcn/ui (Base UI) + Supabase Auth.

## Commands

- `npm run dev` — dev server (Turbopack).
- `npm run build` — production build; also runs TypeScript checks.
- `npm run lint` — runs `eslint` (flat config). **`next lint` no longer exists** in Next.js 16; don't try it.
- `npx tsc --noEmit` — standalone typecheck (faster feedback than a full build).
- No test framework is configured. Don't assume one exists.
- Verify non-trivial changes with: `npm run lint && npx tsc --noEmit && npm run build`.

## Next.js 16 gotchas

- **`proxy.ts` replaces `middleware.ts`.** It lives at `src/proxy.ts` (same level as `app`), exports a function named `proxy`, and runs on the **Node.js runtime by default** — setting `runtime` in it throws. The existing proxy refreshes the Supabase session via `src/utils/supabase/updateSession.ts`.
- `cookies()`, `headers()`, `params`, `searchParams` are **async** — always `await` them.
- React 19.2 + Turbopack are defaults.

## Supabase

- Env required to run: copy `.env.local.example` → `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The clients use `!` non-null assertions and will crash without these.
- Three clients, each a different scope:
  - `src/utils/supabase/client.ts` — browser (Client Components).
  - `src/utils/supabase/server.ts` — **async** `createClient()` for Server Components / Route Handlers (must `await` it; uses async `cookies()`).
  - `src/utils/supabase/updateSession.ts` — used by `proxy.ts` to refresh the session and write cookies/headers back to the response.
- `PROTECTED_ROUTES` in `updateSession.ts` is currently empty; add route prefixes there to gate access. Use `getUser()` (not `getSession()`) for any auth decision — `getSession()` is unverified cookie state.

## shadcn/ui

- Initialized with **Base UI** (`-b base`), `nova` preset, **neutral** base color, CSS variables on (`components.json`). The component library choice is locked after init.
- Add components: `npx shadcn@latest add <name>`. They land in `src/components/ui/`.
- `cn()` helper is at `src/lib/utils.ts`.

## Tailwind CSS v4

- No `tailwind.config.js` — config is CSS-first. Theme tokens live in `src/app/globals.css` via `@import "tailwindcss"` + `@theme inline`. Edit colors there, not in a JS config.
- Font var for sans is `--font-sans` (set in `src/app/layout.tsx`).

## Conventions

- Import alias: `@/*` → `./src/*`.
- `CLAUDE.md` is just `@AGENTS.md` — keep this file as the single source of agent guidance.
