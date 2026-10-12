# Auth Implementation Plan — Frontend (`analyrics-fe`)

> Full design rationale lives in `docs/auth-plan.md`. This file is the
> execution checklist. Before starting any task, read that task's section in
> `docs/auth-plan.md` — it contains traps that are not repeated here.
>
> **Prerequisite:** the backend plan must be complete and deployed. Every task
> here assumes `/api/auth/me`, `/refresh`, `/logout` already work.

## Testing policy for this plan

There is **no frontend test runner installed**, and this plan does not add one.

**"Verified" for every task means:**
- `npm run lint` passes
- `npx tsc --noEmit` passes
- `npm run build` passes
- the manual browser check listed in that task behaves as described

Do not install vitest, jest, or testing-library as part of these tasks. If a
task seems to need one, stop and ask instead of adding a test framework
mid-plan.

Skip the RED step of the TDD cycle throughout — go straight to
implement → typecheck → build → manual check.

## House conventions (do not drift)

`'use client';` first, then `/* System Package */`, then
`/* Application Package */`. Four-space indent under `components/` and `lib/`.
`I`-prefixed interfaces. Default exports. `@/*` alias.

**All user-facing strings stay Vietnamese.**

---

## FE-1 — Types + `apiFetchVoid` `[Required]`

**Status:** Done — lint / typecheck / build pass; `apiFetch`'s guards verified unchanged.

Ref: `docs/auth-plan.md` §4 F1, F2

Merged because F1 alone is a single interface file — too small to be its own
build cycle, and F2 is its first consumer.

- **Create** `src/types/auth/auth.interface.ts`: `IAuthUser`
  (`{ id, name, email, role, created_at }` — mirror the backend's snake_case
  `created_at`, do not silently rename it), `IAuthSession`, `ILoginPayload`,
  `IRegisterPayload`
- **Modify** `src/lib/api.ts`: extract the shared body into an internal
  function parameterised by whether `data` is required, then export the
  existing `apiFetch` plus a new `apiFetchVoid` for logout

`apiFetch` behaviour must stay **byte-identical** for its three current call
sites. Do not weaken its null-data guard — add a sibling, as the file's own
comment at lines 129–131 instructs.

**Acceptance:** typecheck + build + lint pass. The three existing `apiFetch`
call sites still work unchanged.

---

## FE-2 — Auth API layer `[Required]`

**Status:** Done — lint / typecheck / build pass; single-flight verified (two synchronous `refreshSession()` calls issue one request).

Ref: `docs/auth-plan.md` §4 F3

**Create** `src/lib/auth-api.ts`: `login`, `register`, `logout`,
`fetchSession`, `refreshSession`.

This module owns a **module-level in-flight refresh promise**:

```ts
let inFlightRefresh: Promise<IAuthSession> | null = null;
```

Without it, two components mounting at once — or React StrictMode's
double-mount in dev — fire two rotations, one loses, and the loser's 401 is
indistinguishable from a real reuse attack.

**Acceptance:** typecheck + build + lint pass. Manual: call `refreshSession()`
twice synchronously in a scratch component — the network tab shows exactly one
`/auth/refresh` request.

---

## FE-3 — `AuthProvider` + `useAuth` + mount `[Required]`

**Status:** Done — lint / typecheck / build pass.

Ref: `docs/auth-plan.md` §4 F4, F5

Merged because F5 is a three-line change to `layout.tsx` that only exists to
make F4 reachable.

- **Create** `src/components/auth/authProvider.tsx` (`'use client'`), exporting
  the provider and a `useAuth` hook that throws when used outside it
- State `{ user, status: 'loading' | 'authenticated' | 'guest' }`; actions
  `signIn`, `signUp`, `signOut`
- **Bootstrap — the primary path.** `GET /auth/me` → if a user, authenticated.
  If `user: null`, attempt `POST /auth/refresh`. Refresh fails → guest.
  Get this right first; the timer below is the edge case
- **Modify** `src/app/layout.tsx`: wrap `{children}` in `<AuthProvider>`. The
  layout stays a server component

**Silent refresh timer `[Recommended]`** — schedule against
`accessTokenExpiresAt - 60s`, floored at ~30s. **Clamp every computed delay to
≤24h and re-arm** — `setTimeout` overflows above ≈24.86 days and fires
immediately, which would hammer `/auth/refresh` in a loop.

**Acceptance:** typecheck + build + lint pass. Manual: sign in via curl to set
cookies, reload the app — `status` settles on `authenticated` without a flash.
Delete only `access_token`, reload — an automatic `/auth/refresh` fires and the
session is restored.

---

## FE-4 — Modal shell `[Required]`

**Status:** Done — lint / typecheck / build pass.

Ref: `docs/auth-plan.md` §4 F6

**Create** `src/components/auth/authModal.tsx`. No dialog component exists
anywhere in the codebase — this is from scratch.

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Focus trap; focus the first field on open; **restore focus to the trigger on
  close**
- Escape closes; backdrop click closes; lock body scroll while open
- Backdrop `bg-black/70 backdrop-blur`; panel from the `songCard.tsx` glass
  pattern; animated with `scaleIn` inside `AnimatePresence`
- Animate **only** opacity and transform per the standing rule at
  `src/lib/motion.ts:7-11` — keep `backdrop-blur` a static class
- Tabs switch `Đăng nhập` / `Đăng ký`; the caller sets the initial tab

**Acceptance:** typecheck + build + lint pass. Manual keyboard-only check: Tab
cycles inside the modal, Escape closes it, focus returns to the trigger.

---

## FE-5 — Login + register forms `[Required]`

**Status:** Done — lint / typecheck / build pass.

Ref: `docs/auth-plan.md` §4 F7

**Create** `src/components/auth/loginForm.tsx` and `registerForm.tsx`.

Plain controlled `useState`, matching `searchBar.tsx`. **Do not install
react-hook-form or zod** for two small forms.

Mirror `auth.dto.ts` exactly (email format, password `MinLength(6)`, name
non-empty) for fast feedback; the backend stays the authority.

Accessibility: a real `<label>` per field (note `searchBar.tsx` has none — do
not copy that), `aria-invalid`, `aria-describedby` → error node, `role="alert"`
on the form-level error, disabled submit + spinner while pending,
`autoComplete="email" / "current-password" / "new-password"`.

**Two backend quirks to handle:** the global pipe uses
`forbidNonWhitelisted: true`, so posting any undeclared field is a hard 400;
and a pipe rejection bypasses the app envelope, returning Nest's default shape
where **`message` is a string array**. Tolerate both rather than rendering
`[object Object]`.

**Acceptance:** typecheck + build + lint pass. Manual: wrong password shows an
inline Vietnamese error and the modal stays open; duplicate email does the
same.

---

## FE-6 — User menu `[Required]`

**Status:** Done — lint / typecheck / build pass.

Ref: `docs/auth-plan.md` §4 F8

**Create** `src/components/auth/userMenu.tsx`: name button → dropdown showing
email + `Đăng xuất`.

Needs `aria-expanded`, `aria-haspopup`, Escape-to-close, click-outside-to-close.

**Acceptance:** typecheck + build + lint pass. Manual: dropdown opens, Escape
closes it, clicking outside closes it.

---

## FE-7 — Wire the navbar `[Required]`

**Status:** Done — lint / typecheck / build pass.

Ref: `docs/auth-plan.md` §4 F9

**Modify** `src/components/dashboard/navBar.tsx` — the visible payoff.

- Delete `const user = { name: "Khách" }` (line 10); read `useAuth()`
- `loading` → a small skeleton, so the navbar does not flash `Đăng nhập` and
  then snap to the user's name on every page load
- `authenticated` → `<UserMenu />`
- `guest` → the two existing buttons (markup at lines 24–27 is reusable as-is),
  now with `onClick` opening the modal on the matching tab

**Acceptance:** typecheck + build + lint pass. Then run the full manual sweep
below.

---

## Final manual sweep (after FE-7)

Backend on :3001, frontend on :3000.

1. **Register** → modal closes, navbar shows the name. DevTools → Cookies:
   `access_token` (7d) and `refresh_token` (30d, `Path=/api/auth`), both
   `HttpOnly`
2. **Reload** → name persists
3. **Sign out** → buttons return, **both** cookies gone, no console error
4. **Wrong password / duplicate email** → inline Vietnamese error, modal open
5. **Bootstrap refresh** → delete only `access_token`, reload → automatic
   `/auth/refresh`, session restored
6. **Guest regression — the most important check** → private window, no
   sign-in: search, analyze, and trending must all work exactly as before
7. **Two tabs** → force a refresh in both at once; neither is signed out

To observe session behaviour without waiting days, temporarily set
`JWT_EXPIRES_IN=1m` and `REFRESH_TOKEN_EXPIRES_IN=5m` on the backend, run
checks 5–7, then restore 7d/30d and re-run 1–3.
