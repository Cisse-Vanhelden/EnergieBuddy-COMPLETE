import { getUserFromEvent } from "./_lib/auth.js";
import { query } from "./_lib/db.js";
import { badRequest, json, serverError, unauthorized } from "./_lib/response.js";

async function recalcScores(userId) {
  const rows = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN entry_date = CURDATE() THEN GREATEST(0, ROUND(100 - kwh_used * 8)) ELSE 0 END), 0) AS daily_score,
       COALESCE(SUM(CASE WHEN entry_date >= CURDATE() - INTERVAL 6 DAY THEN GREATEST(0, ROUND(100 - kwh_used * 8)) ELSE 0 END), 0) AS weekly_score,
       COALESCE(SUM(CASE WHEN entry_date >= CURDATE() - INTERVAL 29 DAY THEN GREATEST(0, ROUND(100 - kwh_used * 8)) ELSE 0 END), 0) AS monthly_score
     FROM energy_entries
     WHERE user_id = ?`,
    [userId]
  );

  const score = rows[0] || { daily_score: 0, weekly_score: 0, monthly_score: 0 };
  const totalPoints = Number(score.monthly_score || 0) + Number(score.weekly_score || 0);

  await query(
    `INSERT INTO scores (user_id, daily_score, weekly_score, monthly_score, total_points)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       daily_score = VALUES(daily_score),
       weekly_score = VALUES(weekly_score),
       monthly_score = VALUES(monthly_score),
       total_points = VALUES(total_points)`,
    [userId, score.daily_score, score.weekly_score, score.monthly_score, totalPoints]
  );
}

export async function handler(event) {
  const tokenUser = getUserFromEvent(event);
  if (!tokenUser) return unauthorized();

  try {
    if (event.httpMethod === "GET") {
      const entries = await query(
        `SELECT e.id, e.entry_date, e.kwh_used, e.cost_eur, e.notes, d.name AS device_name
         FROM energy_entries e
         LEFT JOIN devices d ON d.id = e.device_id
         WHERE e.user_id = ?
         ORDER BY e.entry_date DESC, e.created_at DESC
         LIMIT 60`,
        [tokenUser.sub]
      );
      return json(200, { entries });
    }

    if (event.httpMethod === "POST") {
      const {
        deviceId = null,
        entryDate = "",
        kwhUsed = 0,
        costEur = 0,
        notes = ""
      } = JSON.parse(event.body || "{}");

      if (!entryDate) return badRequest("Datum is verplicht.");
      if (Number(kwhUsed) < 0) return badRequest("kWh mag niet negatief zijn.");

      await query(
        `INSERT INTO energy_entries (user_id, device_id, entry_date, kwh_used, cost_eur, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tokenUser.sub,
          deviceId ? Number(deviceId) : null,
          entryDate,
          Number(kwhUsed),
          Number(costEur || 0),
          notes ? String(notes).trim() : null
        ]
      );

      await recalcScores(tokenUser.sub);
      return json(201, { ok: true });
    }

    return json(405, { error: "Method not allowed." });
  } catch (error) {
    console.error("entries error", error);
    return serverError();
  }
}
