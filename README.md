# Self playground

The Self playground provides an example usage of Self.

The main page `app/page.tsx` imports `@selfxyz/qrcode` and displays an interface to edit the attributes that should be revealed.

The API endpoint `pages/api/verify.ts` imports `@selfxyz/core`, receives proofs from the Self mobile app and verifies them.

To keep track of which session asks for which attributes, we store a mapping from user identifier to attributes to reveal using Vercel's key value database.

If you're looking for a simpler example that checks a set of fixed attributes, checkout [happy-birthday](https://github.com/selfxyz/happy-birthday) instead.

## Getting Started

- Fork the project and add it to your Vercel account.
- On Vercel, in `Storage`, configure an Upstash For Redis database. Copy `.env.example` to `.env` and add your environment variables.
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

When developing locally, you can route the requests from the mobile app to your local machine by opening an ngrok endpoint using `ngrok http 3000` and replace `endpoint: "https://playground.self.xyz/api/verify"` in `app/page.tsx` with the newly generated url.

When deploying to Vercel, update it to match the URL of your Vercel deployment.
