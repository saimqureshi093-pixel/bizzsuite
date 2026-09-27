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
- Capacitor for Android packaging

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

BizzSuite uses Capacitor to package the Vite web app in a native Android project. Android Studio and its Android SDK are required; install a compatible JDK (Java 17 is recommended) and configure the SDK in Android Studio.

The app configuration is in `capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
   appId: 'com.bizzsuite.app',
   appName: 'BizzSuite',
   webDir: 'dist',
};

export default config;
```

Install Capacitor packages once, then build the web app, create the Android project, and sync the web assets:

```sh
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap add android
npx cap sync
npx cap open android
```

In Android Studio, wait for Gradle sync to finish, then choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The debug APK is saved at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For a signed release, choose **Build > Generate Signed Bundle / APK**, select **APK**, and follow the signing wizard. The release APK is typically saved under `android/app/build/outputs/apk/release/`. Keep the keystore and passwords private and out of source control.

After changing the web app, run `npm run build` and `npx cap sync` again before building in Android Studio.