import { createClient } from '@/lib/supabase/client'

export const supabase = createClient()

export const AUTH_REDIRECT_PATH = '/chat'

// --- 1. AUTHENTICATION SERVICES ---

export async function signInWithGoogle() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(AUTH_REDIRECT_PATH)}`,
      },
    })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err.message || 'OAuth error' }
  }
}

export async function signInWithGithub() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(AUTH_REDIRECT_PATH)}`,
      },
    })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err.message || 'OAuth error' }
  }
}

export async function signUpWithEmail({ name, email, password }) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(AUTH_REDIRECT_PATH)}`,
      },
    })

    if (error) return { ok: false, message: error.message }

    // If session returned immediately (no email verification requirement)
    if (data?.session) {
      return { ok: true, user: data.user }
    }

    return { ok: true, message: 'Account created! Please check your email to verify your account.' }
  } catch (err) {
    return { ok: false, message: err.message || 'Failed to create account.' }
  }
}

export async function signInWithPassword({ email, password }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { ok: false, message: error.message }
    return { ok: true, user: data.user }
  } catch (err) {
    return { ok: false, message: err.message || 'Login failed.' }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function redirectAfterAuthentication(router) {
  router.push(AUTH_REDIRECT_PATH)
}

// --- 2. DOWNLOAD PIPELINE ---

export async function getLatestReleases() {
  const res = await fetch('/api/releases/latest')
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch releases')
  return data.releases
}

export async function downloadForPlatform(platform) {
  const res = await fetch('/api/downloads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Download failed')

  if (data.download_url) {
    const link = document.createElement('a')
    link.href = data.download_url
    link.download = data.file_name || 'nirmaraksh-ai-setup'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  return data
}

// --- 3. STREAMING CHAT API ---

export async function* streamTrialChat(messages, signal) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Chat request failed')
  }

  const reader = res.body?.getReader()
  const decoder = new TextDecoder()
  if (!reader) throw new Error('No response stream')

  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data: ')) {
        const dataStr = trimmed.slice(6)
        if (dataStr === '[DONE]') return
        try {
          const parsed = JSON.parse(dataStr)
          if (parsed.content) yield parsed.content
        } catch {
          // JSON parsing chunk fallback
        }
      }
    }
  }
}
