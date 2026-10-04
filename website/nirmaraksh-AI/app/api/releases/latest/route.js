import { NextResponse } from "next/server";
import { STATIC_RELEASES_LIST } from "@/data/releases";

function formatRelease(release) {
  return {
    ...release,
    version: release.version,
    platform: release.platform,
    fileName: release.file_name,
    fileSizeBytes: release.file_size_bytes,
    sha256Checksum: release.sha256_checksum,
  };
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      releases: STATIC_RELEASES_LIST.map(formatRelease),
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
