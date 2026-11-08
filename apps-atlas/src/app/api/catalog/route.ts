import { getIdentity } from "../../../../cursor/identity";
import type { AppRecord, LayerRecord } from "@/lib/catalog";
import { sql } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getIdentity(request);
  if (!identity.verified) {
    return Response.json(
      { error: "unauthorized", reason: identity.reason },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  }

  await ensureSeeded();

  const dbFilter = new URL(request.url).searchParams.get("db");
  const apps =
    dbFilter && ["yes", "maybe", "no"].includes(dbFilter)
      ? await sql<AppRecord>(
          `select * from apps where db_need = $1 order by layer, sort_order, name`,
          [dbFilter],
        )
      : await sql<AppRecord>(
          `select * from apps order by layer, sort_order, name`,
        );

  const layers = await sql<LayerRecord>(
    `select * from structure_layers order by sort_order, id`,
  );

  const stats = {
    total: apps.length,
    dbYes: apps.filter((a) => a.db_need === "yes").length,
    dbMaybe: apps.filter((a) => a.db_need === "maybe").length,
    dbNo: apps.filter((a) => a.db_need === "no").length,
    viewer: identity.email || identity.sub,
  };

  return Response.json(
    { stats, layers, apps },
    { headers: { "cache-control": "private, no-store" } },
  );
}
