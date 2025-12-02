# Giftpool – Event Gifting & Wishlist MVP

Giftpool is a lightweight event gifting and wishlist app. Hosts can create an event, share a guest code, and track which gifts are being planned or have been bought. Guests can see the wishlist, pick an item to buy, and coordinate without needing an account.

## How it works

- **Create an event**  
  - Host enters event name, date, and email.  
  - The system generates a **host code** and a **guest code**, then emails them to the host.  
  - The host is taken to the dashboard to manage the wishlist.

- **Access by code**  
  - On the homepage, users enter either the **host** or **guest** code.  
  - Host code → host dashboard (full control).  
  - Guest code → guest view (read-only list + claim actions).  
  - Access is managed via short‑lived (1 hour) HTTP-only code sessions.

- **Host dashboard**  
  - Add, edit, and remove wishlist items (name, link, description, quantity display).  
  - See live status for each item: **Available**, **Planned**, or **Bought**, with a host-only display name.  
  - Copy and share the guest code with invitees.

- **Guest view**  
  - See the full list of items and their current status.  
  - Mark an item as **Planning** or **Bought**.  
  - Guests must enter a name (used only for their own undo) and can choose to stay anonymous to the host.  
  - Guests can undo their choice by re-entering the same name used originally.

- **Email notifications**  
  - When a guest marks an item as **Bought**, the host receives an email notification.  
  - In dev mode without SES configured, emails are logged to the console.

## Technologies

- **Framework**: Nuxt 4 (Vue 3, Nitro)  
- **UI**: Nuxt UI (Tailwind-based components)  
- **Database**: SQLite in development, designed for Cloudflare D1 in production (via `drizzle-orm`)  
- **ORM**: Drizzle ORM (SQLite/D1)  
- **Runtime**: Node for local dev, Cloudflare Workers target in production  
- **Email**: AWS SES via `aws4fetch`, wrapped with a small `sendEmail` helper  

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## License

This project is licensed under the **MIT License**.

