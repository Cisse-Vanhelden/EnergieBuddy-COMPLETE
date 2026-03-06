import { query } from "./_lib/db.js";
import { json, serverError } from "./_lib/response.js";

export async function handler() {
  try {
    const rows = await query(
      `SELECT u.display_name, u.is_demo, s.total_points, s.weekly_score, s.monthly_score
       FROM scores s
       INNER JOIN users u ON u.id = s.user_id
       ORDER BY s.total_points DESC, s.monthly_score DESC
       LIMIT 20`
    );

    return json(200, { leaderboard: rows });
  } catch (error) {
    console.error("leaderboard error", error);
    return serverError();
  }
}
