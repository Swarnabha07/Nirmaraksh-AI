import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: releases, error } = await supabase
      .from('releases')
      .select('*')
      .eq('is_latest', true)

    if (!error && releases && releases.length > 0) {
      const formattedReleases = releases.map((release) => ({
        ...release,
        version: release.version,
        platform: release.platform,
        fileName: release.file_name,
        fileSizeBytes: release.file_size_bytes,
        sha256Checksum: release.sha256_checksum,
      }))

      return NextResponse.json({
        success: true,
        releases: formattedReleases,
      })
    }

    // Default releases info fallback
    const fallbackReleases = [
      {
        version: '1.0.0',
        platform: 'windows',
        fileName: 'nirmaraksh-ai-setup-win.exe',
        fileSizeBytes: 124500000,
        sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        isFallback: true,
      },
      {
        version: '1.0.0',
        platform: 'mac',
        fileName: 'nirmaraksh-ai-setup-mac.dmg',
        fileSizeBytes: 131200000,
        sha256Checksum: 'a8f5f167f44f4964e6c998dee827110c',
        isFallback: true,
      },
      {
        version: '1.0.0',
        platform: 'linux',
        fileName: 'nirmaraksh-ai-setup-linux.AppImage',
        fileSizeBytes: 118900000,
        sha256Checksum: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
        isFallback: true,
      },
    ]

    return NextResponse.json({
      success: true,
      isFallback: true, // placeholder data: no published releases exist in the database yet
      releases: fallbackReleases,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
