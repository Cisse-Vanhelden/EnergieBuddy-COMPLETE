import bcrypt from "bcryptjs";
import { query } from "./_lib/db.js";
import { badRequest, json, serverError, unauthorized } from "./_lib/response.js";
import { authCookie, signUser } from "./_lib/auth.js";
import "dotenv/config";

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });

  try {
    const { email = "", password = "" } = JSON.parse(event.body || "{}");
    if (!email || !password) {
      return badRequest("Email en wachtwoord zijn verplicht.");
    }

    const rows = await query(
      "SELECT id, email, display_name, password_hash FROM users WHERE email = ? LIMIT 1",
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user) return unauthorized("Onjuiste login.");

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return unauthorized("Onjuiste login.");

    const token = signUser(user);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": authCookie(token)
      },
      body: JSON.stringify({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name
        }
      })
    };
  } catch (error) {
    console.error("login error", error);
    return serverError();
  }
}
