# curry-blasters_AMUHACKS4.0

# Smart Suggestion System for Urban Planning

A civic platform built like Reddit where citizens can post, report, and track local urban issues. Developed for AMUHACKS 4.0 under the Smart City Development track, this project represents a scalable solution for city-wide collaboration between residents and municipal bodies.

---

## Overview
The system enables:
- Citizens to post suggestions and report existing problems in their locality
- Other users to engage by commenting, upvoting, and replying
- Location-specific content feed
- Image uploads, report categorization, and live dark/light mode toggle

The app features a modular structure using Next.js, TypeScript, Tailwind CSS, and a growing backend powered by PostgreSQL. Built for extensibility and real-world deployment.

---

## 🛠️ Tech Stack
**Frontend**:
- React + Next.js 15
- TypeScript + TailwindCSS + ShadCN UI
- Lucide React Icons
- React Hook Form + Zod for form validation
- Next Themes for dark mode

**Backend** (Planned):
- Node.js / Express
- PostgreSQL via pgAdmin
- Drizzle ORM (for schema and migrations)
- Admin control panel and user management (in development)

**Package Manager**: pnpm

---

## Key Project Files and Configs (from ZIP)

### `package.json`
Includes dependencies for UI, animation, form handling, and theming:
- UI: `@radix-ui/react-*`, `shadcn/ui`, `lucide-react`
- Forms: `react-hook-form`, `zod`
- Styling: `tailwindcss`, `clsx`, `tailwindcss-animate`

{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "cross-env NODE_ENV=development dotenv -e .env -- tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-collapsible": "^1.1.1",
    "@radix-ui/react-context-menu": "^2.2.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-hover-card": "^1.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.2",
    "@radix-ui/react-navigation-menu": "^1.2.1",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.1",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.3",
    "@replit/vite-plugin-shadcn-theme-json": "^0.0.4",
    "@tanstack/react-query": "^5.60.5",
    "bcryptjs": "^3.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "connect-pg-simple": "^10.0.0",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.3.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "framer-motion": "^11.13.1",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.453.0",
    "memorystore": "^1.6.7",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.1",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.4",
    "recharts": "^2.13.0",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.0",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.23.8",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@replit/vite-plugin-cartographer": "^0.0.11",
    "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
    "@tailwindcss/typography": "^0.5.15",
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/node": "20.16.11",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "cross-env": "^7.0.3",
    "dotenv-cli": "^8.0.0",
    "drizzle-kit": "^0.30.4",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47", 
    "tailwindcss": "^3.4.14",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.14"
  },
  "optionalDependencies": {
    "bufferutil": "^4.0.8"
  }
}

### `tsconfig.json`
Supports modern TypeScript dev environment with path aliases and strict checking.

{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}

### `tailwind.config.ts`
Customizes TailwindCSS with extended color palettes and animations.

import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

### `vite.config.ts`
Prepares the dev server for rapid hot-reloads and JSX support.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});

### `.env`
Environment variables for local PostgreSQL setup and session handling:
```
DATABASE_URL=postgres://postgres:<your_password>@localhost:5432/civicpulse
SESSION_SECRET=change_me_123
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/civicpulse
SESSION_SECRET=change_me_123

### `theme.json`
Theme values injected into Tailwind-compatible design system.

{
  "variant": "professional",
  "primary": "#2A7D4F",
  "appearance": "light",
  "radius": 0.5
}

---

##  Component & UI Logic (Detailed File Breakdown)

### `App.tsx`
Bootstraps the main layout and providers. Sets up routes and global UI state.

### `main.tsx`
Mounts the React DOM root using `ReactDOM.createRoot()`.

### `suggestion-card.tsx`
Displays:
- Title, description
- Optional image
- Upvote/downvote count
- Links to comments & replies

### `new-suggestion-modal.tsx`
Controlled form using `react-hook-form` and `zod`. Supports live image preview.

### `report-modal.tsx`
Allows reporting of problems. Users pick a type, write a description, and upload images. Bug: custom field is not binding.

### `comment-list.tsx`
Handles:
- Viewing & nesting replies
- Submit comment/reply
- Placeholder for moderation tools

### `header.tsx`
Sticky top nav containing dark mode toggle, navigation buttons, and modal triggers.

### `reset-db-button.tsx`
Manual button to refresh/reset DB state (for development only).

### UI Components (`/components/ui`)
All reusable parts styled via ShadCN + Tailwind:
- Buttons, cards, dropdowns, modals, alerts, forms
- Built on `@radix-ui/react-*` primitives

---

## Folder Structure
```
├── app/                      → Core app routing/views
│   ├── layout.tsx            → Theme + layout wrapper
│   ├── page.tsx              → Login page
│   ├── feed/page.tsx         → Suggestion feed (main)
│   ├── contact/page.tsx      → Contact form (non-functional)
│
├── components/
│   ├── ui/                   → Styled UI elements (ShadCN)
│   └── custom/               → Post, comment, report, modals
│
├── hooks/                   → `useLocalStorage`, `useMounted`
├── lib/                     → Utility functions
├── public/                  → Static assets
├── tailwind.config.ts       → Tailwind setup
├── tsconfig.json            → TypeScript config
├── vite.config.ts           → Vite (optional fast dev)
├── .env                     → DB credentials
└── package.json             → Project metadata
```

---

## Local Setup Guide

### Prerequisites:
- Node.js (v18+), pnpm
- PostgreSQL (v16) + pgAdmin (for GUI access)

### 1. Clone and Install
```bash
git clone <repo>
cd curry-blasters_AMUHACKS4.0
pnpm install
```

### 2. Set Up `.env`
```
DATABASE_URL=postgres://postgres:<your_password>@localhost:5432/civicpulse
SESSION_SECRET=change_me_123
```

### 3. PostgreSQL Setup
- Create DB: `civicpulse`
- Run migrations:
```bash
pnpm run db:push
```

### 4. Windows Compatibility Fixes
```bash
pnpm add -D cross-env
pnpm remove bcrypt
pnpm add bcryptjs
```
Edit package.json:
```json
"dev": "cross-env NODE_ENV=development tsx server/index.ts"
```

### 5. Start the App
```bash
pnpm dev
```
Visit: `http://localhost:3000`

---

## Core Features Summary

| Feature            | Status         | Notes                              |
|--------------------|----------------|-------------------------------------|
| Auth (email/pass)  |  Working     | No admin role yet                   |
| Post Suggestion    |  Working     | With image and location             |
| Report Problem     |  UI Ready    | Bug in text input field             |
| Upvote/Downvote    | ⚠ Buggy       | No toggle feedback after click      |
| Comment/Reply      | Working     | Comment threads are nested          |
| Delete Post        |  Working     | Only by author                      |
| Edit Post          |  Not Working | UI exists, no handler               |
| Hot Tab            |  Not Working | Planned with vote-sorting           |
| Location Tab       |  Not Working | To be implemented                   |
| Contact Us         |  Broken      | Non-functional form                 |
| Report Comments    |  Missing     | Placeholder only                    |
| NSFW/Profanity     |  Missing     | Planned (image + text censor)       |
| Admin Panel        |  Missing     | Future milestone                    |

---

##  Future Roadmap
- Add working admin panel to manage suggestions
- Sort by trending (Hot tab logic)
- Integrate PAN/Aadhaar for secure ID
- Implement NSFW and foul-language filtering
- Improve responsiveness for mobile
- Add push notifications + email alerts

---

##  Team Curry Blasters
- Submission for: **AMUHACKS 4.0**
- Track: **Smart City Development**
- Contact: `curryblasters@gmail.com`
- Phone: `1234567890`
- GitHub Repo: curry-blasters_AMUHACKS4.0

---

##  Final Note
This platform was built from scratch under time constraints of a hackathon, but with vision for long-term impact. It emphasizes transparency, location awareness, and public participation in civic development — built for the citizens, by the citizens.
