import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

const encoder = new TextEncoder();

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(keyBytes: Uint8Array, message: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return await crypto.subtle.sign("HMAC", key, encoder.encode(message));
}

async function verifyTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) {
    throw new Error("Некоректний Telegram hash");
  }

  const authDate = Number(params.get("auth_date"));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate > now + 60 || now - authDate > 86400) {
    throw new Error("Telegram initData прострочено");
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // Telegram Web Apps algorithm: HMAC(key="WebAppData", message=botToken).
  const secretKey = new Uint8Array(
    await hmac(encoder.encode("WebAppData"), botToken),
  );
  const calculatedHash = hex(await hmac(secretKey, dataCheckString));

  if (calculatedHash.toLowerCase() !== receivedHash.toLowerCase()) {
    throw new Error("Не вдалося підтвердити Telegram initData");
  }

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("У Telegram initData немає користувача");
  const user = JSON.parse(userRaw);
  const telegramUserId = Number(user.id);
  if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) {
    throw new Error("Некоректний Telegram user ID");
  }
  return telegramUserId;
}

function validProfile(profile: unknown): profile is Record<string, unknown> {
  if (!profile || typeof profile !== "object") return false;
  const p = profile as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id) &&
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    p.name.length <= 60 &&
    (p.gender === "Дівчинка" || p.gender === "Хлопчик") &&
    typeof p.birthDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(p.birthDate)
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const initData = body?.initData;
    const action = body?.action;

    if (typeof initData !== "string" || !initData || typeof action !== "string") {
      return Response.json({ error: "Missing initData or action" }, { status: 400, headers: corsHeaders });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!botToken || !supabaseUrl || !serviceRoleKey) {
      throw new Error("На сервері не налаштовані секрети Supabase або Telegram");
    }

    const telegramUserId = await verifyTelegramInitData(initData, botToken);
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (action === "list") {
      const { data, error } = await admin
        .from("telegram_family_profiles")
        .select("profile_data")
        .eq("telegram_user_id", telegramUserId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return Response.json(
        { success: true, profiles: (data ?? []).map((row) => row.profile_data) },
        { headers: corsHeaders },
      );
    }

    if (action === "sync") {
      if (!Array.isArray(body.profiles) || body.profiles.length > 30) {
        return Response.json({ error: "Некоректний список профілів" }, { status: 400, headers: corsHeaders });
      }

      const rows = body.profiles.map((profile: unknown) => {
        if (!validProfile(profile)) throw new Error("Один із профілів має некоректні дані");
        return {
          id: profile.id,
          telegram_user_id: telegramUserId,
          profile_data: profile,
          updated_at: new Date().toISOString(),
        };
      });

      if (rows.length > 0) {
        const { error } = await admin
          .from("telegram_family_profiles")
          .upsert(rows, { onConflict: "telegram_user_id,id" });
        if (error) throw error;
      }

      return Response.json({ success: true, saved: rows.length }, { headers: corsHeaders });
    }

    return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error("[family-profiles]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 400, headers: corsHeaders },
    );
  }
});
