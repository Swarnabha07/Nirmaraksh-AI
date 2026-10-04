// Static fallback release data, used only when the Supabase `releases` table has no
// matching published row for a platform. Real DB rows (once published) always take
// precedence over this — see app/api/releases/latest/route.js and app/api/downloads/route.js.
//
// Field names intentionally mirror the real `releases` table columns (snake_case
// download_url / file_name / file_size_bytes / sha256_checksum) so both routes can treat
// a static entry exactly like a DB row, with no changes needed in the frontend.
//
// Windows ships as a ZIP served directly from /public/downloads. macOS and Linux have no
// downloadable build yet, so they point at the project's GitHub repository instead.

export const STATIC_RELEASES = {
  windows: {
    version: "1.0.0",
    platform: "windows",
    file_name: "Nirmaraksh-Ai-Desktop.zip",
    download_url: "/downloads/Nirmaraksh-Ai-Desktop.zip",
    file_size_bytes: 3196516,
    sha256_checksum:
      "f05c8724cfc3615df3e1afce3ef07f250b25afa8612679df0f0a4ccdae369666",
  },
  mac: {
    version: "1.0.0",
    platform: "mac",
    file_name: null,
    download_url: "https://github.com/Swarnabha07/Nirmaraksh-AI",
    file_size_bytes: null,
    sha256_checksum: null,
  },
  linux: {
    version: "1.0.0",
    platform: "linux",
    file_name: null,
    download_url: "https://github.com/Swarnabha07/Nirmaraksh-AI",
    file_size_bytes: null,
    sha256_checksum: null,
  },
};

export const STATIC_RELEASES_LIST = Object.values(STATIC_RELEASES);
