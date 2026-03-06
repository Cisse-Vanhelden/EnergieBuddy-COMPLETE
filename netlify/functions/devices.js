import { getUserFromEvent } from "./_lib/auth.js";
import { query } from "./_lib/db.js";
import { badRequest, json, serverError, unauthorized } from "./_lib/response.js";

export async function handler(event) {
  const tokenUser = getUserFromEvent(event);
  if (!tokenUser) return unauthorized();

  try {
    if (event.httpMethod === "GET") {
      const devices = await query(
        "SELECT id, name, category, wattage, hours_per_day, created_at FROM devices WHERE user_id = ? ORDER BY created_at DESC",
        [tokenUser.sub]
      );
      return json(200, { devices });
    }

    if (event.httpMethod === "POST") {
      const { name = "", category = "", wattage = 0, hoursPerDay = 0 } = JSON.parse(event.body || "{}");
      if (!name || !category) {
        return badRequest("Naam en categorie zijn verplicht.");
      }

      const result = await query(
        "INSERT INTO devices (user_id, name, category, wattage, hours_per_day) VALUES (?, ?, ?, ?, ?)",
        [tokenUser.sub, name.trim(), category.trim(), Number(wattage || 0), Number(hoursPerDay || 0)]
      );

      const rows = await query(
        "SELECT id, name, category, wattage, hours_per_day, created_at FROM devices WHERE id = ? LIMIT 1",
        [result.insertId]
      );

      return json(201, { device: rows[0] });
    }

    if (event.httpMethod === "DELETE") {
      const id = Number(event.queryStringParameters?.id || 0);
      if (!id) return badRequest("Ongeldig device id.");

      await query("DELETE FROM devices WHERE id = ? AND user_id = ?", [id, tokenUser.sub]);
      return json(200, { ok: true });
    }

    return json(405, { error: "Method not allowed." });
  } catch (error) {
    console.error("devices error", error);
    return serverError();
  }
}
