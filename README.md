This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Admin push notifications

The Notifications page sends Firebase Cloud Messaging pushes through a server-only API route. Configure these server environment variables in `.env.local` and in the deployment environment:

- `FIREBASE_ADMIN_PROJECT_ID` — Firebase project ID (may be left blank to reuse `NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
- `FIREBASE_ADMIN_CLIENT_EMAIL` — service-account client email.
- `FIREBASE_ADMIN_PRIVATE_KEY` — service-account private key; preserve newlines or store them as `\n`.

Use a Firebase service account with the permissions needed to verify Firebase ID tokens, read the admin and user documents in Firestore, write notification records, and send FCM messages. Keep its credentials server-side only; never use a `NEXT_PUBLIC_` prefix or commit the values.

The route reads device tokens from user documents in the `users` collection. It supports common fields such as `fcmToken`, `fcmTokens`, `fcm_token`, `notificationToken`, `messagingToken(s)`, `deviceToken(s)`, `pushToken(s)`, and `tokens` (string values or arrays/maps of strings). If the mobile app stores FCM tokens under a different field, align the field name in `src/app/api/notifications/send/route.ts`.
