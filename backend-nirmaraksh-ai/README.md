# Backend Architecture

This document describes the backend architecture of the application in two parts:

1. **Part 1: Overall Structure**: the high-level layout of the system and how the layers talk to each other.
2. **Part 2: Deeper Structural Build**: a sub-system by sub-system look at auth, streaming, persistence and telemetry.

## Table of Contents

- [Part 1: Overall Structure](#part-1-overall-structure)
  - [System Diagram](#system-diagram)
  - [Layers at a Glance](#layers-at-a-glance)
  - [Request Flows](#request-flows)
  - [Diagram Legend](#diagram-legend)
- [Part 2: Deeper Structural Build](#part-2-deeper-structural-build)
  - [Sub-system 1: Auth and Automatic Database Trigger](#sub-system-1-auth-and-automatic-database-trigger)
  - [Sub-system 2: Real-time Streaming AI Pipeline](#sub-system-2-real-time-streaming-ai-pipeline)
  - [Sub-system 3: Chat Persistence and Composite Indexing](#sub-system-3-chat-persistence-and-composite-indexing)
  - [Sub-system 4: Privacy-preserving Telemetry and Atomic RPC](#sub-system-4-privacy-preserving-telemetry-and-atomic-rpc)
  - [Cascade Deletion Behaviour](#cascade-deletion-behaviour)
  - [Security Summary](#security-summary)

---

# Part 1: Overall Structure

## System Diagram

<!-- PLACEHOLDER: Replace the path below with your Part 1 flowchart (overall architecture) -->

![Overall Architecture Flowchart](./docs/images/architecture-overview.png)

*Figure 1: Overall backend architecture, from client to managed backend.*

## Layers at a Glance

The system is split into four layers. Each has a single, clear responsibility.

| Layer | Technology | Responsibility |
|---|---|---|
| **Client Layer** | Next.js 15 | User-facing UI: chat console, auth modals, download requests |
| **Server & Runtime Layer** | Next.js App Router | API routes, session verification, SSE streaming, telemetry |
| **Intelligence Tier** | Nirmaraksh Engine | Agentic reasoning; streams tokens back to the server |
| **Supabase Managed Backend** | Auth, PostgreSQL, Storage | Identity, persistent data, and file storage |

### Client Layer (Next.js 15)

| Component | Purpose |
|---|---|
| **Agentic chat console** | Takes prompt input and renders tokens live as they stream in |
| **Auth modals** | Sign-in via Google OAuth, GitHub, or email |
| **User browser** | The Next.js 15 client that issues download requests |

### Server & Runtime Layer (Next.js App Router)

| Component | Purpose |
|---|---|
| **`POST /api/chat`** | SSE stream handler. Verifies the session first, then forwards the request to the intelligence tier |
| **SSR middleware** | Cookie session keeper built on `@supabase/ssr`. Keeps the browser and Supabase Auth in sync |
| **`POST /api/downloads`** | Telemetry handler. Logs the download event and fetches the file |

### Intelligence Tier

| Component | Purpose |
|---|---|
| **Nirmaraksh Engine** | Handles agentic reasoning and streams tokens back to `/api/chat` |

### Supabase Managed Backend

| Component | Contents |
|---|---|
| **Supabase Auth** | `auth.users` table, identity provider |
| **PostgreSQL Database** | `profiles`, `demo_messages`, `download_events` |
| **Supabase Storage** | `binaries` bucket holding package files |

## Request Flows

### 1. Authentication

1. The user signs in from the **Auth modals** (Google OAuth, GitHub, or email).
2. The request passes through the **SSR middleware**, which manages the session cookie.
3. The middleware and **Supabase Auth** sync cookies in both directions, keeping the session valid and refreshed.

### 2. Chat

1. The user submits a prompt in the **Agentic chat console**.
2. `POST /api/chat` **verifies the session first** against Supabase Auth.
3. The request is forwarded to the **Nirmaraksh Engine**.
4. The engine streams tokens back over **SSE**, and the console renders them live.
5. Messages are persisted **asynchronously** to PostgreSQL.

### 3. Downloads

1. The browser sends a download request to `POST /api/downloads`.
2. The handler logs the event to PostgreSQL (asynchronously).
3. The handler fetches the package file from the Supabase Storage `binaries` bucket.

## Diagram Legend

| Arrow | Meaning |
|---|---|
| Solid grey arrow | Request or auth |
| Solid yellow arrow | SSE token stream |
| Dashed green arrow | Async persistence |
| Double-headed grey arrow | Cookie sync |

---

# Part 2: Deeper Structural Build

## Detailed Sub-system Diagram

<!-- PLACEHOLDER: Replace the path below with your Part 2 flowchart (detailed sub-systems) -->

![Detailed Sub-system Flowchart](./docs/images/architecture-subsystems.png)

*Figure 2: The four backend sub-systems, with the cascade-delete relationships highlighted.*

The backend is composed of four sub-systems. Node letters (A to U) match the labels in Figure 2.

---

## Sub-system 1: Auth and Automatic Database Trigger

<!-- PLACEHOLDER (optional): Add a zoomed-in crop of Sub-system 1 -->
<!-- ![Sub-system 1](./docs/images/subsystem-1-auth.png) -->

Handles sign-up and sign-in, and automatically provisions a profile row for every new user.

| Node | Step | Details |
|---|---|---|
| **A** | Client browser | OAuth (Google / GitHub) or email signup |
| **B** | Next.js SSR | `@supabase/ssr`: `getAll()` reads cookies, `getUser()` refreshes the JWT |
| **C** | `auth.users` | Supabase Auth table; a new identity row is inserted |
| **D** | DB trigger | `on_auth_user_created`, fires `AFTER INSERT` on `auth.users` |
| **E** | Trigger function | `public.handle_new_user()`, declared `SECURITY DEFINER` |
| **F** | Insert profile | Copies `full_name` and `avatar_url` from `raw_user_meta_data` into `public.profiles` |
| **G** | Row level security | On `public.profiles` |

### Flow

```
Client browser → Next.js SSR → auth.users (new row)
                                    │
                                    ▼
                   on_auth_user_created (AFTER INSERT)
                                    │
                                    ▼
                       public.handle_new_user()
                                    │
                                    ▼
                         INSERT INTO public.profiles
```

### Design notes

- **Automatic provisioning.** A database trigger creates the profile, so the application never needs a separate "create profile" call, and there is no window where a user exists without a profile.
- **`SECURITY DEFINER`.** The trigger function runs with its owner's privileges, so it can write to `public.profiles` even though the insert originates from the auth schema.
- **Row level security (RLS) on `public.profiles`:**
  - Users can **view** their own profile.
  - Users can **update** their own profile.
  - Enforced by `auth.uid() = id`.
- **Referential integrity.** `profiles.id` references `auth.users` with `ON DELETE CASCADE`.

---

## Sub-system 2: Real-time Streaming AI Pipeline

<!-- PLACEHOLDER (optional): Add a zoomed-in crop of Sub-system 2 -->
<!-- ![Sub-system 2](./docs/images/subsystem-2-streaming.png) -->

Delivers AI responses token by token to the UI over Server-Sent Events (SSE).

| Node | Step | Details |
|---|---|---|
| **H** | Client call | `streamTrialChat()` issues `POST /api/chat` |
| **I** | Session check | `supabase.auth.getUser()` validates the session token |
| **J** | Routing logic | The Nirmaraksh AI engine handles the request |
| **K** | SSE `ReadableStream` | `TextEncoder` chunks tokens every 25 ms, formatted as `data: {"content": token}\n\n` |
| **L** | Async generator | Yields tokens to the UI in real time |

### Flow

```
streamTrialChat() ──► POST /api/chat ──► getUser() ──► Nirmaraksh Engine
                                                             │
UI (async generator) ◄── SSE ReadableStream (25 ms chunks) ◄─┘
```

### Design notes

- **Auth before compute.** The session is validated before any request reaches the engine, so unauthenticated calls never consume AI resources.
- **Server-Sent Events.** Tokens are framed as `data: {"content": token}\n\n`, which is the standard SSE wire format and easy to parse on the client.
- **Paced chunking.** The `TextEncoder` emits tokens at about 25 ms intervals, which gives a smooth, consistent typing effect in the UI.
- **Async generator on the client.** The consumer yields tokens as they arrive, so the UI re-renders incrementally instead of waiting for the full response.

---

## Sub-system 3: Chat Persistence and Composite Indexing

<!-- PLACEHOLDER (optional): Add a zoomed-in crop of Sub-system 3 -->
<!-- ![Sub-system 3](./docs/images/subsystem-3-persistence.png) -->

Stores conversation history with fast chronological retrieval and per-user isolation.

| Node | Component | Details |
|---|---|---|
| **M** | `public.demo_messages` | Columns: `id`, `user_id`, `role`, `content`, `created_at` |
| **N** | Composite B-tree index | `idx_demo_messages_user` on `(user_id, created_at)` |
| **O** | Row level security | Users manage their own demo messages via `auth.uid() = user_id` |

### Schema summary

| Column | Notes |
|---|---|
| `id` | Primary key |
| `user_id` | Foreign key to `auth.users`, `ON DELETE CASCADE` |
| `role` | `CHECK` constraint: must be `'user'` or `'assistant'` |
| `content` | Message body |
| `created_at` | Timestamp used for ordering |

### Design notes

- **Composite index `(user_id, created_at)`.** A single index lookup serves the most common query ("this user's messages, in order"), so retrieval is instant and needs no separate sort step.
- **`role` CHECK constraint.** Invalid roles are rejected by the database itself, not just by application code.
- **RLS.** Each user can read and write only their own rows.

---

## Sub-system 4: Privacy-preserving Telemetry and Atomic RPC

<!-- PLACEHOLDER (optional): Add a zoomed-in crop of Sub-system 4 -->
<!-- ![Sub-system 4](./docs/images/subsystem-4-telemetry.png) -->

Records download events without storing raw IP addresses, and keeps related writes atomic.

| Node | Step | Details |
|---|---|---|
| **P** | Client action | `POST /api/downloads` triggers a download event |
| **Q** | Extract context | IP from `x-forwarded-for`; country from `x-vercel-ip-country` |
| **R** | Privacy hashing | IP + a 32-character secret SALT, hashed with SHA-256 into `ip_hash` |
| **S** | Atomic RPC call | `register_download_event()`, declared `SECURITY DEFINER` |
| **T** | Atomic transaction | See below |
| **U** | `idx_download_events_user` | B-tree on `(user_id)` for fast per-user lookups |

### Atomic transaction (node T)

Both steps run inside one database function, so they succeed or fail together:

1. `UPDATE public.profiles SET has_downloaded = true`
2. `INSERT INTO public.download_events (user_id, platform, ip_hash, country)`

### Flow

```
POST /api/downloads
      │
      ├─ read IP (x-forwarded-for) and country (x-vercel-ip-country)
      │
      ├─ ip_hash = SHA-256(IP + SECRET_SALT)
      │
      └─ rpc: register_download_event()   [SECURITY DEFINER]
               ├─ UPDATE profiles SET has_downloaded = true
               └─ INSERT INTO download_events (...)
```

### Design notes

- **Privacy by design.** The raw IP is never persisted. Only a salted SHA-256 hash is stored, which still allows abuse detection and unique-count analytics.
- **Secret salt.** Because the salt is secret and 32 characters long, the hash cannot be reversed with a precomputed lookup table.
- **Atomicity.** Wrapping both writes in one RPC means a profile can never be flagged `has_downloaded` without a matching event row, or the reverse.
- **Indexing.** `idx_download_events_user` keeps per-user history queries fast.

---

## Cascade Deletion Behaviour

The red lines in Figure 2 show the `ON DELETE CASCADE` relationships tied to `auth.users`.

| Child table | Foreign key | Behaviour |
|---|---|---|
| `public.profiles` | `id` → `auth.users` | Row is deleted with the user |
| `public.demo_messages` | `user_id` → `auth.users` | Rows are deleted with the user |

> **Deleting an `auth.users` identity wipes the matching `public.profiles` and `public.demo_messages` rows.**

This keeps data clean and supports account-deletion and privacy requirements without any manual cleanup jobs.

## Security Summary

| Mechanism | Where it is applied |
|---|---|
| Session verification before compute | `POST /api/chat` |
| Cookie-based session management | SSR middleware (`@supabase/ssr`) |
| Row level security | `profiles`, `demo_messages` |
| `SECURITY DEFINER` functions | `handle_new_user()`, `register_download_event()` |
| `CHECK` constraint | `demo_messages.role` |
| Salted SHA-256 IP hashing | Download telemetry |
| `ON DELETE CASCADE` | `profiles`, `demo_messages` |

---