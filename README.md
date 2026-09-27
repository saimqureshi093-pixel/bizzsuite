# BizzSuite

**Everything Your Business Needs, In One Suite**

BizzSuite is a web-based business management app built for handling day-to-day sales, inventory, customers, purchasing, expenses, and reporting.

## Features

- Dashboard for a quick view of business activity
- Product catalog and inventory management
- Customer and supplier records
- Sales point of sale, sales history, invoices, and payment recording
- Purchase entry and purchase history
- Expense tracking
- Business reports
- Account authentication and team roles
- Business settings
- Installable Progressive Web App (PWA) with service-worker asset caching

## Tech Stack

- React 18 and TypeScript
- Vite
- Tailwind CSS
- Supabase for authentication and database
- Zustand for client-side state
- React Router and Recharts
- vite-plugin-pwa for the web app manifest and service worker

## Setup

### Prerequisites

- Node.js and npm
- A Supabase project

### Install and configure

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env.local` file in the project root with your Supabase project URL and anon key:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. Apply the SQL migration files in `supabase/migrations/` to your Supabase project in timestamp order. You can use the Supabase SQL Editor or the Supabase CLI.

4. Start the development server:

   ```sh
   npm run dev
   ```

### Available scripts

```sh
npm run dev        # Start the local development server
npm run build      # Create a production build in dist/
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint
npm run typecheck  # Run the TypeScript app type check
```

## Build an Android APK

BizzSuite is configured as a PWA, not as a native Android project. To package the deployed PWA as an Android Trusted Web Activity (TWA), use Bubblewrap. The resulting APK opens the hosted BizzSuite site; it does not bundle a separate native implementation.

### Requirements

- Deploy BizzSuite to a public HTTPS domain
- Install Node.js, Java 17, and the Android SDK (including build-tools)
- Configure the Android SDK environment for your shell

Build the web app and deploy the contents of `dist/` to your HTTPS host first. Then install Bubblewrap and initialize it from the deployed PWA manifest:

```sh
npm install --global @bubblewrap/cli
bubblewrap init --manifest https://your-domain.example/manifest.webmanifest
bubblewrap build
```

Follow Bubblewrap's prompts to configure the Android application ID and signing key. Set up Digital Asset Links for your domain by publishing the generated `assetlinks.json` at `https://your-domain.example/.well-known/assetlinks.json`; the TWA needs this domain association to display without browser controls. Bubblewrap reports the generated APK location when the build completes. Keep signing keys private and do not commit them.