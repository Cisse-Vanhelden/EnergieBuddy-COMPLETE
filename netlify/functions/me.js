import { getUserFromEvent } from "./_lib/auth.js";
import { query } from "./_lib/db.js";
import { json, serverError, unauthorized } from "./_lib/response.js";

export async function handler(event) {
  const tokenUser = getUserFromEvent(event);
  if (!tokenUser) return unauthorized();

  try {
    const rows = await query(
      `SELECT u.id, u.email, u.display_name, u.is_demo,
              p.household_size, p.home_type, p.city, p.bio,
              s.daily_score, s.weekly_score, s.monthly_score, s.total_points
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN scores s ON s.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [tokenUser.sub]
    );

    const user = rows[0];
    if (!user) return unauthorized();

    return json(200, { user });
  } catch (error) {
    console.error("me error", error);
    return serverError();
  }
}
