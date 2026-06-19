# Nova Bank

Modern digital banking demo built with Next.js, React, Tailwind CSS, MySQL, Firebase Google sign-in, and Nodemailer email notifications.

## Features

- Colorful landing page with hero, carousel, footer, and scroll animations
- Login, registration, and Google sign-in
- Protected dashboard with sidebar navigation
- Bank accounts, transfers, bill payments, statements, smart spend, savings goals, profile, settings, and notifications
- Styled email notifications for login, registration, transfers, bill payments, and e-statements
- MySQL-backed users, accounts, transactions, bill payments, budgets, savings goals, beneficiaries, audit logs, and email notification queue

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- MySQL with `mysql2`
- Firebase/Firebase Admin for Google auth
- Nodemailer for SMTP email
- Biome for linting/formatting

## Quick Start

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment

Create `.env.local` and set the values you need:

```env
DATABASE_URL=mysql://user:password@localhost:3306/htn26db
SESSION_SECRET=change-this-secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

If SMTP is not configured, emails are still saved in the `email_notifications` table with `outbox_only` status.

## Scripts

```bash
npm run dev      # start development server
npm run build    # production build
npm run start    # start production server
npm run lint     # run Biome checks
npm run format   # format files
```

## Main Routes

- `/` landing page
- `/login` login
- `/sign-up` registration
- `/dashboard` signed-in overview
- `/bank-transfer` transfers
- `/pay-bills` bill payments
- `/e-statement` account statements
- `/notifications` email notification history
- `/settings` profile/security/preferences

## Notes

The database schema is created automatically by the app on first use. Protected pages redirect signed-out users to `/login`.
