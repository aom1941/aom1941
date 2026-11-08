import { sql } from "./db";
import { SEED_APPS, SEED_LAYERS } from "./catalog";

let seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;

  const [{ count }] = await sql<{ count: string }>(
    "select count(*)::text as count from apps",
  );
  if (Number(count) === 0) {
    for (const layer of SEED_LAYERS) {
      await sql(
        `insert into structure_layers (id, title, role, contents, sort_order)
         values ($1, $2, $3, $4, $5)
         on conflict (id) do nothing`,
        [layer.id, layer.title, layer.role, layer.contents, layer.sort_order],
      );
    }
    for (const app of SEED_APPS) {
      await sql(
        `insert into apps (
           id, name, path, layer, kind, zweck, capabilities,
           storage_today, db_need, maturity, github_url, sort_order
         ) values (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
         ) on conflict (id) do nothing`,
        [
          app.id,
          app.name,
          app.path,
          app.layer,
          app.kind,
          app.zweck,
          app.capabilities,
          app.storage_today,
          app.db_need,
          app.maturity,
          app.github_url,
          app.sort_order,
        ],
      );
    }
  }

  seeded = true;
}
