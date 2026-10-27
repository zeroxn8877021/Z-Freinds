# Z Friends

Expo (React Native) app. Backend: Supabase project `Zex` (auth, Postgres + RLS, storage, edge functions).

## One-time setup
1. Supabase dashboard → Authentication → Providers → Email → turn **Confirm email** OFF (or users must confirm by mail).
2. Supabase dashboard → Edge Functions → Secrets → add `GROQ_API_KEY` (profile photo check uses it).
3. Sign up in the app with `ps8877021@gmail.com` — that account becomes the admin automatically.

## Build the APK
Push this folder to GitHub (branch `main`). GitHub Actions → "Build APK" runs and uploads `z-friends-apk` under the run's Artifacts.

## Run locally
`npm install && npx expo install --fix && npx expo start`
