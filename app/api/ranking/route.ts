import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================
// POST → salvar ranking
// ==========================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const playerName = String(body.playerName || "").trim().slice(0, 12);
    const totalTime = Number(body.totalTime);
    const secrets = Array.isArray(body.secrets) ? body.secrets : [];

    // validação nome
    if (!playerName) {
      return NextResponse.json(
        { error: "Nome inválido" },
        { status: 400 }
      );
    }

    // validação tempo
    if (!Number.isFinite(totalTime) || totalTime < 0) {
      return NextResponse.json(
        { error: "Tempo inválido" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("ranking").insert([
      {
        player_name: playerName,
        total_time: totalTime,
        secrets,
      },
    ]);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao salvar ranking" },
      { status: 500 }
    );
  }
}

// ==========================
// GET → buscar ranking
// ==========================
export async function GET() {
  const { data, error } = await supabase
    .from("ranking")
    .select("player_name, total_time, secrets")
    .order("total_time", { ascending: true })
    .limit(10);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}
