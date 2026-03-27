import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BANNED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "porra",
  "caralho",
  "merda",
  "puta",
  "foda",
"fukc",
"bct",
"buceta",
];

function normalizeBlockedText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function maskBlockedWords(text: string) {
  let masked = text;

  for (const word of BANNED_WORDS) {
    const pattern = new RegExp(word.split("").join("[^a-zA-Z]*"), "gi");
    masked = masked.replace(pattern, (match) => "*".repeat(match.length));
  }

  return masked;
}

function containsBlockedWord(text: string) {
  const normalized = normalizeBlockedText(text);
  return BANNED_WORDS.some((word) => normalized.includes(word));
}

function isRepeatedCharacterSpam(text: string) {
  return /^(.)\1+$/.test(text);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rawPlayerName = String(body.playerName || "").trim().slice(0, 12);
    const totalTime = Number(body.totalTime);
    const secrets = Array.isArray(body.secrets) ? body.secrets : [];

    if (!rawPlayerName || isRepeatedCharacterSpam(rawPlayerName)) {
      return NextResponse.json({ error: "Nome inválido 🚫" }, { status: 400 });
    }

    const maskedName = maskBlockedWords(rawPlayerName);

    if (containsBlockedWord(rawPlayerName) || maskedName !== rawPlayerName) {
      return NextResponse.json(
        { error: "Nome inválido 🚫", sanitizedName: maskedName },
        { status: 400 }
      );
    }

    if (!Number.isFinite(totalTime) || totalTime < 0) {
      return NextResponse.json({ error: "Tempo inválido" }, { status: 400 });
    }

    const { error } = await supabase.from("ranking").insert([
      {
        player_name: rawPlayerName,
        total_time: totalTime,
        secrets,
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar ranking" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from("ranking")
    .select("player_name, total_time, secrets, created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sorted = (data ?? [])
    .map((entry) => ({
      ...entry,
      secrets: Array.isArray(entry.secrets) ? entry.secrets : [],
    }))
    .sort((a, b) => {
      const secretsDiff = b.secrets.length - a.secrets.length;
      if (secretsDiff !== 0) return secretsDiff;

      return a.total_time - b.total_time;
    });

  return NextResponse.json(sorted);
}
