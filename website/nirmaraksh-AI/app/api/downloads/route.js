import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

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

    // Try Supabase RPC register_download_event if user is logged in
    if (user) {
      const { data, error } = await supabase.rpc("register_download_event", {
        p_user_id: user.id,
        p_platform: platform,
        p_ip_hash: ipHash,
        p_country: country ?? undefined,
      });

      if (!error && data?.success) {
        return NextResponse.json({
          success: true,
          download_url: data.download_url,
          file_name: data.file_name,
          downloadUrl: data.download_url,
          fileName: data.file_name,
        });
      }
    }

    // Anonymous users (or a failed RPC): use the published release row for this platform.
    const { data: rows } = await supabase
      .from("releases")
      .select("download_url, file_name")
      .eq("platform", platform)
      .eq("is_latest", true)
      .order("published_at", { ascending: false })
      .limit(1);

    const release = rows?.[0];

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
