# Nirmaraksh AI — Full Application

Agentic Cybersecurity Intelligence Workspace (Landing Page + Trial AI Chat + Auth + Downloads).

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase Auth · Server-Sent Events (SSE).

---

## Quick Start for Teammates

### 1. Requirements
- Node.js 18.18+ (Node 20+ recommended)
- npm (comes with Node)

### 2. Environment Setup
Create or verify your `.env.local` file in the root folder:
```bash
# Copy from example template
cp .env.example .env.local
```
Ensure your `.env.local` has your Supabase and OpenAI credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SALT=e4c8f2a1b9d037651a8e2f4c6b0d9e3a

# Optional: For live OpenAI streaming (defaults to built-in cybersecurity engine if blank)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser:
- Main Landing: `http://localhost:3000/`
- Agentic Trial AI Chat: `http://localhost:3000/chat`

### 5. Production Check (Optional)
```bash
npm run build
npm start
```

---

## Directory Architecture

- `app/` — Next.js App Router (pages, layout, globals.css, and API endpoints)
  - `app/api/chat/route.js` — Streaming AI cybersecurity chat endpoint
  - `app/api/downloads/route.js` — Desktop binary download handler
  - `app/api/releases/latest/route.js` — Supabase releases endpoint
  - `app/auth/callback/route.js` — OAuth & session exchange callback
  - `app/chat/page.js` — Agentic chat console route
- `components/`
  - `components/chat/` — AI Core HUD, ChatConsole, Sidebar, Audio Waveform
  - `components/landing/` — Landing page sections & interactive demos
  - `components/auth/` — Supabase Auth modals & session provider
  - `components/layout/` — Global Header & Footer
  - `components/ui/` — Buttons, Dialogs, Icons, Brand assets
- `data/` — Static site settings, agent definitions, access flows, mock demo data
- `lib/` — API helpers, Supabase clients (`client.js`, `server.js`), schema types (`database.ts`)
- `public/` — Static images and application icons
- `scripts/` — Automated test suites (`test-backend.ts`)
- `middleware.js` — Next.js Supabase session cookie refresh middleware
