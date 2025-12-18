Authentication setup and local testing

Environment variables
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key
- `NEXT_PUBLIC_APP_URL` — (optional) absolute URL of your app, e.g. `http://localhost:3000`. Used for absolute redirect links in email flows.

Routes added
- `/login` — sign in with email/password
- `/signup` — create account (email confirmation flows depend on your Supabase settings)
- `/reset` — request password reset
- `/reset/update` — link target users land on to set a new password
- `/dashboard` — example protected page that requires an authenticated session

Dev run
1. Set env vars (e.g. in a `.env.local` file):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. Install and run dev server

```bash
npm install
npm run dev
```

Testing flows
- Visit `/signup` to create an account. If your Supabase project requires email confirmation, a confirmation link will be sent to the email.
- Visit `/login` to sign in. You can include a `redirectTo` query param to return to a specific page after sign-in (for example, `/login?redirectTo=/dashboard`).
- Visit `/reset` to request a password reset. The password reset email will point to `/reset/update` by default; you can pass a `redirectTo` query param when requesting reset (for example, `/reset?redirectTo=/some/path`).

Notes
- The app uses `@supabase/ssr` server and browser clients located in `src/lib/supabase`. Ensure the env vars are set before running.
- The layout now includes an `AuthNav` component that shows sign-in state and links.
