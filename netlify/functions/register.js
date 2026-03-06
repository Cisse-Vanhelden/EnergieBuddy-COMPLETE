import bcrypt from "bcryptjs";
import { query } from "./_lib/db.js";
import { badRequest, json, serverError } from "./_lib/response.js";
import { authCookie, signUser } from "./_lib/auth.js";
import "dotenv/config";

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });

  try {
    const { email = "", password = "", displayName = "" } = JSON.parse(event.body || "{}");

    if (!email || !password || !displayName) {
      return badRequest("Naam, email en wachtwoord zijn verplicht.");
    }

    if (password.length < 8) {
      return badRequest("Wachtwoord moet minstens 8 tekens hebben.");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existing.length) {
      return badRequest("Er bestaat al een account met dit e-mailadres.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)",
      [normalizedEmail, passwordHash, displayName.trim()]
    );

    await query("INSERT INTO profiles (user_id) VALUES (?)", [result.insertId]);
    await query("INSERT INTO scores (user_id) VALUES (?)", [result.insertId]);

    const token = signUser({
      id: result.insertId,
      email: normalizedEmail,
      display_name: displayName.trim()
    });

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": authCookie(token)
      },
      body: JSON.stringify({
        ok: true,
        user: {
          id: result.insertId,
          email: normalizedEmail,
          display_name: displayName.trim()
        }
      })
    };
  } catch (error) {
    console.error("register error", error);
    return serverError();
  }
}
