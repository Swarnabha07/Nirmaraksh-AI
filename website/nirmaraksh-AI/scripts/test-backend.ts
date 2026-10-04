import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/types/database'

// ---------------------------------------------------------------------------
// 1. Environment Loading (.env.local)
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eqIdx = line.indexOf('=')
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx).trim()
        const value = line.slice(eqIdx + 1).trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface TestResult {
  step: string
  passed: boolean
  durationMs: number
  error?: string
}

const results: TestResult[] = []

async function runStep(
  name: string,
  fn: () => Promise<void>
): Promise<boolean> {
  const start = performance.now()
  try {
    await fn()
    const duration = Math.round(performance.now() - start)
    results.push({ step: name, passed: true, durationMs: duration })
    return true
  } catch (err: unknown) {
    const duration = Math.round(performance.now() - start)
    const message = err instanceof Error ? err.message : String(err)
    results.push({ step: name, passed: false, durationMs: duration, error: message })
    return false
  }
}

function printStatusTable() {
  const cReset = '\x1b[0m'
  const cGreen = '\x1b[32m'
  const cRed = '\x1b[31m'
  const cCyan = '\x1b[36m'
  const cBold = '\x1b[1m'
  const cDim = '\x1b[2m'

  console.log('\n' + cBold + cCyan + 'Supabase Backend Test Suite' + cReset)
  console.log(cDim + '═'.repeat(74) + cReset)

  const colStep = 48
  const colStatus = 10
  const colTime = 10

  const pad = (str: string, len: number) =>
    str.length > len ? str.slice(0, len - 3) + '...' : str + ' '.repeat(len - str.length)

  console.log(
    cBold +
      pad('Test Step', colStep) +
      pad('Status', colStatus) +
      pad('Duration', colTime) +
      cReset
  )
  console.log(cDim + '─'.repeat(74) + cReset)

  let passedCount = 0
  let totalTime = 0

  for (const r of results) {
    totalTime += r.durationMs
    const statusText = r.passed
      ? `${cGreen}✔ PASS${cReset}`
      : `${cRed}✖ FAIL${cReset}`

    console.log(
      pad(r.step, colStep) +
        pad(statusText, colStatus + (r.passed ? 9 : 9)) +
        pad(`${r.durationMs}ms`, colTime)
    )

    if (!r.passed && r.error) {
      console.log(`  ${cRed}Error: ${r.error}${cReset}`)
    } else {
      passedCount++
    }
  }

  console.log(cDim + '─'.repeat(74) + cReset)
  const allPassed = passedCount === results.length
  const summaryColor = allPassed ? cGreen : cRed

  console.log(
    `${summaryColor}${cBold}Results: ${passedCount}/${results.length} passed${cReset} | ` +
      `Total time: ${(totalTime / 1000).toFixed(2)}s\n`
  )
}

// ---------------------------------------------------------------------------
// 2. Main Test Runner
// ---------------------------------------------------------------------------
async function main() {
  if (!SUPABASE_URL) {
    console.error('\n\x1b[31m[ERROR] NEXT_PUBLIC_SUPABASE_URL is missing in .env.local\x1b[0m')
    process.exit(1)
  }

  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'your_supabase_service_role_key_here') {
    console.error(
      '\n\x1b[31m[ERROR] SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local\x1b[0m\n' +
        'To run backend tests, paste your project service_role key into .env.local:\n' +
        'SUPABASE_SERVICE_ROLE_KEY=<your-secret-key>\n\n' +
        'Dashboard: Project Settings -> API Keys -> service_role (secret)\n'
    )
    process.exit(1)
  }

  const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  let testUserId: string | null = null
  const testEmail = `mock-test-${Date.now()}@example.com`

  try {
    // -----------------------------------------------------------------------
    // Step 1: User Signup & Profile Auto-Creation Trigger
    // -----------------------------------------------------------------------
    await runStep('1. Auth trigger auto-creates public.profiles record', async () => {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'MockSecurePassword2026!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Antigravity Test User',
          avatar_url: 'https://example.com/avatar.png',
        },
      })

      if (authError || !authData.user) {
        throw new Error(`Failed to create test user: ${authError?.message}`)
      }

      testUserId = authData.user.id

      // Poll/query profile created by trigger
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single()

      if (profileError || !profile) {
        throw new Error(`Profile not created by trigger: ${profileError?.message}`)
      }

      if (profile.email !== testEmail) {
        throw new Error(`Profile email mismatch: expected ${testEmail}, got ${profile.email}`)
      }
      if (profile.has_downloaded !== false) {
        throw new Error(`Expected has_downloaded false, got ${profile.has_downloaded}`)
      }
    })

    // -----------------------------------------------------------------------
    // Step 2: Latest Releases Catalog Query
    // -----------------------------------------------------------------------
    await runStep('2. GET /api/releases/latest returns 3 seeded platforms', async () => {
      const { data: releases, error } = await supabase
        .from('releases')
        .select('*')
        .eq('is_latest', true)

      if (error) {
        throw new Error(`Failed to fetch releases: ${error.message}`)
      }

      if (!releases || releases.length !== 3) {
        throw new Error(`Expected 3 latest releases, got ${releases?.length ?? 0}`)
      }

      const platforms = releases.map((r) => r.platform)
      for (const expected of ['windows', 'mac', 'linux'] as const) {
        if (!platforms.includes(expected)) {
          throw new Error(`Missing expected release platform: ${expected}`)
        }
      }
    })

    // -----------------------------------------------------------------------
    // Step 3: Demo Messages Insertion & Retrieval
    // -----------------------------------------------------------------------
    await runStep('3. demo_messages persists and queries conversation', async () => {
      if (!testUserId) throw new Error('Test user not initialized')

      const { data: inserted, error: insertError } = await supabase
        .from('demo_messages')
        .insert([
          {
            user_id: testUserId,
            role: 'user',
            content: 'Hello Agent AI',
          },
          {
            user_id: testUserId,
            role: 'assistant',
            content: 'Hello! I am the Web Preview of Agent AI.',
          },
        ])
        .select()

      if (insertError || !inserted || inserted.length !== 2) {
        throw new Error(`Failed to insert demo messages: ${insertError?.message}`)
      }

      const { data: messages, error: queryError } = await supabase
        .from('demo_messages')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: true })

      if (queryError || !messages || messages.length !== 2) {
        throw new Error(`Failed to query demo messages: ${queryError?.message}`)
      }
    })

    // -----------------------------------------------------------------------
    // Step 4: Download Registration & Metrics Tracking
    // -----------------------------------------------------------------------
    await runStep('4. register_download_event increments count and flags has_downloaded', async () => {
      if (!testUserId) throw new Error('Test user not initialized')

      // 1. Get initial download count for platform
      const { data: initialRelease, error: relErr } = await supabase
        .from('releases')
        .select('download_count')
        .eq('platform', 'windows')
        .single()

      if (relErr || !initialRelease) {
        throw new Error(`Failed to query release before download: ${relErr?.message}`)
      }

      const initialCount = initialRelease.download_count ?? 0

      // 2. Call register_download_event RPC
      const { data, error } = await supabase.rpc('register_download_event', {
        p_user_id: testUserId,
        p_platform: 'windows',
        p_ip_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        p_country: 'IN',
      })

      if (error) {
        throw new Error(`register_download_event RPC error: ${error.message}`)
      }

      const res = data as { success: boolean; download_url?: string; file_name?: string }
      if (!res.success || !res.download_url) {
        throw new Error(`Expected download registration success, got: ${JSON.stringify(res)}`)
      }

      // 3. Verify profile has_downloaded = true
      const { data: updatedProfile, error: profErr } = await supabase
        .from('profiles')
        .select('has_downloaded')
        .eq('id', testUserId)
        .single()

      if (profErr || !updatedProfile?.has_downloaded) {
        throw new Error('Profile has_downloaded was not set to true')
      }

      // 4. Verify release download_count incremented
      const { data: updatedRelease, error: upRelErr } = await supabase
        .from('releases')
        .select('download_count')
        .eq('platform', 'windows')
        .single()

      if (upRelErr || (updatedRelease?.download_count ?? 0) !== initialCount + 1) {
        throw new Error(
          `Expected download_count ${initialCount + 1}, got ${updatedRelease?.download_count}`
        )
      }

      // 5. Verify download_events row inserted
      const { data: events, error: eventErr } = await supabase
        .from('download_events')
        .select('*')
        .eq('user_id', testUserId)

      if (eventErr || !events || events.length === 0) {
        throw new Error('No download_events record found for test user')
      }
    })

    // -----------------------------------------------------------------------
    // Step 5: Test User Cleanup & Cascade Verification
    // -----------------------------------------------------------------------
    await runStep('5. Cleanup test user from auth.users (cascades to profiles & messages)', async () => {
      if (!testUserId) throw new Error('No user to delete')

      const { error: deleteError } = await supabase.auth.admin.deleteUser(testUserId)
      if (deleteError) {
        throw new Error(`Failed to delete user: ${deleteError.message}`)
      }

      // Verify cascading deletion on profiles
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', testUserId)

      if (profileCheck && profileCheck.length > 0) {
        throw new Error('Profile record was not deleted by cascade')
      }

      // Verify cascading deletion on demo_messages
      const { data: messageCheck } = await supabase
        .from('demo_messages')
        .select('id')
        .eq('user_id', testUserId)

      if (messageCheck && messageCheck.length > 0) {
        throw new Error('Demo messages record was not deleted by cascade')
      }

      testUserId = null
    })
  } finally {
    // Safety cleanup in case of test failure midway
    if (testUserId) {
      try {
        await supabase.auth.admin.deleteUser(testUserId)
      } catch {
        // Ignore safety cleanup errors
      }
    }
  }

  printStatusTable()

  const hasFailures = results.some((r) => !r.passed)
  process.exit(hasFailures ? 1 : 0)
}

main().catch((err) => {
  console.error('\n\x1b[31mUnexpected Runner Error:\x1b[0m', err)
  process.exit(1)
})
