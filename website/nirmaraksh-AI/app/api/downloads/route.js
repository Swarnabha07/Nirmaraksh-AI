import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { STATIC_RELEASES } from "@/data/releases";

// Only absolute https URLs or same-origin paths may be returned as a download target.
const SAFE_DOWNLOAD_URL = /^(https:\/\/|\/(?!\/))/;

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const { platform } = body;

    if (!platform || !["windows", "mac", "linux"].includes(platform)) {
      return NextResponse.json(
        {
          success: false,
          error: "Platform must be one of: windows, mac, linux",
        },
        { status: 400 },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const rawIp =
      (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) ||
      "127.0.0.1";

    const salt = process.env.SALT || "default_salt_32_characters_random";

    const ipHash = createHash("sha256")
      .update(`${rawIp}:${salt}`)
      .digest("hex");

    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;

    // Keep download telemetry for authenticated users.
    // The RPC result is intentionally NOT used as the download URL,
    // because the database may still contain old release URLs.
    if (user) {
      await supabase.rpc("register_download_event", {
        p_user_id: user.id,
        p_platform: platform,
        p_ip_hash: ipHash,
        p_country: country ?? undefined,
      });
    }

    // The static release configuration is the source of truth for the
    // current hackathon download page.
    const release = STATIC_RELEASES[platform];

    if (
      !release?.download_url ||
      !SAFE_DOWNLOAD_URL.test(release.download_url)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "No release has been published for this platform yet.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      download_url: release.download_url,
      file_name: release.file_name,
      downloadUrl: release.download_url,
      fileName: release.file_name,
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
