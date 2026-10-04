# Nirmaraksh AI — Project Instructions

## Project Identity

The project name is **Nirmaraksh AI**.

IMPORTANT:

* The correct spelling is `Nirmaraksh`.
* Do NOT use `Nimaraksh`.
* Do NOT use `Servicest AI`.
* Use `Nirmaraksh AI` consistently in UI copy, documentation, comments, metadata, and project references unless a different technical name is explicitly required.

Nirmaraksh AI is an agentic cybersecurity workspace focused on authorized security assessment and penetration-testing workflows.

The current development priority is the frontend. Backend architecture and implementation will be introduced separately.

---

## Technology

Current frontend stack:

* Next.js
* Next.js App Router
* JavaScript
* React
* Tailwind CSS
* Framer Motion where appropriate
* Lucide React where appropriate

Authentication:

* Supabase will be used for authentication.

Database:

* The database/storage architecture is NOT finalized yet.
* MongoDB + Mongoose is currently under consideration but is not confirmed.
* Do NOT assume MongoDB or Mongoose is the final database solution.
* Do NOT add Mongoose or database-specific architecture unless explicitly requested.

---

## JavaScript Only

This project uses JavaScript.

NEVER create:

* `.ts` files
* `.tsx` files
* TypeScript-specific configuration

Use:

* `.js`
* `.jsx`

Do not convert the project to TypeScript.

---

## Next.js Architecture

Use the Next.js App Router.

Prefer Server Components by default.

Use `"use client"` only when client-side functionality actually requires it, such as:

* React state
* browser APIs
* interactive menus
* client-side event handlers
* interactive animations
* client-side forms
* other browser-only functionality

Do not unnecessarily make entire pages client components.

---

## Code Architecture

Keep the project modular and maintainable.

Do not put large amounts of unrelated code inside `app/page.js`.

Use sensible component boundaries.

A typical structure may include:

```text
app/
components/
  layout/
  landing/
  ui/
lib/
public/
```

Adapt the structure to the actual application rather than blindly following this example.

Avoid:

* giant components
* meaningless one-line components
* excessive abstraction
* duplicated logic
* deeply nested conditional logic
* unnecessary utility files
* unnecessary dependencies

Prefer simple, readable, maintainable code.

---

## Existing Code

Before modifying the project:

1. Inspect the relevant existing files.
2. Understand the current implementation.
3. Preserve existing working functionality.
4. Make the smallest reasonable change that solves the requested task.

Do NOT blindly rewrite or replace large parts of the application.

Do not modify unrelated files unless necessary.

---

## Dependencies

Keep dependencies minimal.

Before adding a new dependency:

1. Check whether the existing stack already provides the required functionality.
2. Check whether a small native implementation is sufficient.
3. Only add the dependency if it provides meaningful value.

Do not install large libraries for functionality that can reasonably be implemented with the existing stack.

---

## Environment Variables and Secrets

NEVER expose, print, commit, or intentionally copy secrets.

Treat these as sensitive:

* `.env.local`
* `.env.development.local`
* `.env.production.local`
* API keys
* database credentials
* Supabase secrets
* authentication secrets
* tokens
* private keys

Do not put secret values directly into source code.

Use environment variables.

For example:

```js
process.env.SOME_SECRET
```

rather than hardcoding the secret.

NEVER include actual secret values in generated documentation, comments, commits, or responses.

---

## Supabase

Supabase will be used for authentication.

When implementing authentication:

* Use Supabase's official authentication mechanisms.
* Keep authentication logic separate from UI components where practical.
* Do not invent a custom authentication system.
* Do not hardcode Supabase credentials.
* Use environment variables for Supabase configuration.
* Do not assume the final database architecture based on Supabase unless explicitly requested.

The exact Supabase integration architecture will be decided when authentication implementation begins.

---

## Database

The database architecture is currently undecided.

MongoDB + Mongoose is being considered, but this decision is currently 50/50.

Therefore:

* Do NOT install Mongoose automatically.
* Do NOT create MongoDB models automatically.
* Do NOT create MongoDB-specific utilities automatically.
* Do NOT assume MongoDB is the final database.
* Do NOT make database-dependent architectural decisions without explicit instruction.

If database work is requested before the database decision is finalized, ask for clarification or implement the requested functionality in a database-agnostic way where practical.

---

## Frontend Design

For frontend implementation, prioritize:

* visual accuracy
* clean spacing
* typography
* responsive behavior
* accessibility
* performance
* maintainability
* consistent design language

The frontend should work properly on:

* desktop
* laptop
* tablet
* mobile

Do not simply shrink desktop layouts for mobile.

Preserve the intended visual hierarchy at different screen sizes.

---

## Figma / Design Implementation

When a Figma design or exported Figma project is provided:

Treat it as the primary visual reference.

Preserve, where applicable:

* layout
* typography
* colors
* spacing
* borders
* radii
* shadows
* gradients
* imagery
* icons
* buttons
* animations
* hover states
* responsive behavior
* decorative elements

Use the provided assets instead of inventing replacements when the actual assets are available.

If the design is ambiguous, choose an implementation consistent with the existing visual language rather than introducing unrelated design patterns.

---

## Accessibility

Use semantic HTML where appropriate.

Interactive elements should be accessible using:

* keyboard navigation
* appropriate button/link semantics
* meaningful labels
* useful alt text
* appropriate ARIA attributes when needed
* visible focus states

Do not sacrifice accessibility purely for visual appearance.

---

## Performance

Prefer lightweight implementations.

* Use Server Components where possible.
* Avoid unnecessary client-side JavaScript.
* Avoid unnecessary dependencies.
* Avoid unnecessary re-renders.
* Optimize images appropriately.
* Do not introduce expensive effects without a reason.

---

## Security

Nirmaraksh AI is a cybersecurity-oriented application.

Security should be treated as a first-class engineering concern.

For application code:

* Validate untrusted input.
* Avoid unsafe HTML rendering.
* Avoid exposing secrets.
* Avoid trusting client-side authorization decisions.
* Keep privileged operations server-side.
* Follow least-privilege principles.
* Do not introduce insecure shortcuts merely to make a feature work.

Nirmaraksh AI is intended for authorized security assessment.

Do not implement functionality that assumes unauthorized access to third-party systems.

For future security-tool integrations, maintain clear authorization boundaries and human approval where appropriate.

---

## Backend

The backend is not yet fully implemented.

Do not invent backend architecture unless explicitly requested.

When backend development begins, keep it separated from presentation/UI concerns.

Do not create fake API implementations merely to make the frontend appear functional unless mock data is explicitly appropriate.

---

## Development Workflow

When given a task:

### Step 1 — Understand

Inspect the relevant existing code and determine:

* what currently exists
* what needs to change
* which files are affected
* whether the requested change introduces architectural consequences

### Step 2 — Plan

For non-trivial changes, briefly identify:

* files to modify
* files to create
* important implementation decisions
* possible side effects

### Step 3 — Implement

Make the requested change.

Prefer targeted modifications over unnecessary rewrites.

### Step 4 — Verify

After implementation:

* check for syntax errors
* check imports
* check obvious runtime issues
* check responsive behavior when relevant
* check that existing functionality wasn't unnecessarily broken

If the environment prevents actually running a command, clearly state that it could not be verified.

Never claim something was tested if it was not actually tested.

---

## Git

Do not automatically:

* commit changes
* push changes
* create branches
* reset or discard user changes

unless explicitly instructed.

Before destructive Git operations, ask for confirmation.

Never commit secrets.

---

## File Scope

This project directory is the primary workspace:

```text
Nirmaraksh AI/
└── nirmaraksh-ai/
```

Prefer operating only within this project.

Do not intentionally modify unrelated projects or files elsewhere on the computer.

If a task genuinely requires access outside the project directory, explain why before doing it.

---

## Communication

When making code changes:

* Be concise.
* Explain important architectural decisions.
* Mention files changed.
* Mention important assumptions.
* Mention anything that could not be verified.
* Do not claim success without verification.

Do not add unnecessary comments to code.

Comments should explain non-obvious reasoning, not restate what the code already says.

---

## Current Project Priorities

The current priorities are:

1. Build and refine the Nirmaraksh AI frontend.
2. Maintain clean Next.js App Router architecture.
3. Integrate Supabase authentication when requested.
4. Finalize the database architecture later.
5. Build the backend and agentic AI system after the frontend foundation is stable.

Do not jump ahead to later architecture unless explicitly requested.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
