# Self playground

The Self playground provides an example usage of Self.

The main page `app/page.tsx` imports `@selfxyz/qrcode` and displays an interface to edit the attributes that should be revealed.

The API endpoint `pages/api/verify.ts` imports `@selfxyz/core`, receives proofs from the Self mobile app and verifies them.

To keep track of which session asks for which attributes, we store a mapping from user identifier to attributes to reveal using Vercel's key value database.

If you're looking for a simpler example that checks a set of fixed attributes, checkout [happy-birthday](https://github.com/selfxyz/happy-birthday) instead.

## Getting Started

- Fork the project and add it to your Vercel account.
- On Vercel, in `Storage`, configure an Upstash For Redis database. Copy `.env.example` to `.env` and add your environment variables.
- Environment routing:
  `SELF_ENV` is the single source of truth for the active Self environment.
  `next.config.js` re-exposes it to the client as `NEXT_PUBLIC_SELF_ENV`, so the QR payload and backend verifier stay aligned.
  Set `SELF_ENV=staging` on the staging Vercel project only.
  Leave `SELF_ENV` unset on the production Vercel project.
  If you use Vercel Preview deployments to exercise staging behavior, set `SELF_ENV=staging` at the Preview scope too. Unset Preview vars on the production project will resolve to production behavior.
  Local development defaults to staging when `SELF_ENV` is unset, and `.env.example` sets `SELF_ENV=staging` so `yarn dev` does not hit production endpoints by default.
  `SELF_VERIFY_ENDPOINT_OVERRIDE` is optional and lets you override the verify endpoint for both client and server without editing tracked code.
  Note: Vercel only applies environment variable changes to new deployments — both server and client will keep using the previous values until you redeploy. `NEXT_PUBLIC_SELF_ENV` and `NEXT_PUBLIC_SELF_VERIFY_ENDPOINT_OVERRIDE` are additionally inlined into the client bundle at build time, so the client cannot pick up changes any earlier than that redeploy either.
- Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

When developing locally, you can route the requests from the mobile app to your local machine by opening an ngrok endpoint using `ngrok http 3000` and setting `SELF_VERIFY_ENDPOINT_OVERRIDE` to the generated URL, for example `https://198c-166-144-250-126.ngrok-free.app/api/verify`.

The QR payload endpoint and the `SelfBackendVerifier` endpoint must stay aligned or verification will fail because the SDK hashes the endpoint into the proof scope.
