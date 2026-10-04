/**
 * Authentication integration boundary connected to Supabase Auth.
 */

export {
  AUTH_REDIRECT_PATH,
  signInWithGoogle,
  signInWithGithub,
  signUpWithEmail,
  signInWithPassword,
  signOut,
  getCurrentUser,
  redirectAfterAuthentication,
} from '@/lib/api'
