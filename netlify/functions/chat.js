import OpenAI from "openai";
import { getUserFromEvent } from "./_lib/auth.js";
import { query } from "./_lib/db.js";
import { badRequest, json, serverError, unauthorized } from "./_lib/response.js";
import "dotenv/config";

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });

  const tokenUser = getUserFromEvent(event);
  if (!tokenUser) return unauthorized();

  try {
    const { message = "", page = "" } = JSON.parse(event.body || "{}");
    if (!message.trim()) return badRequest("Leeg bericht.");

    const userRows = await query(
      `SELECT u.display_name, s.daily_score, s.weekly_score, s.monthly_score, s.total_points
       FROM users u
       LEFT JOIN scores s ON s.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [tokenUser.sub]
    );

    const deviceRows = await query(
      "SELECT name, category, wattage, hours_per_day FROM devices WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
      [tokenUser.sub]
    );

    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const profile = userRows[0] || {};
    const context = {
      page,
      user: profile,
      devices: deviceRows
    };

    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Je bent een vriendelijke AI assistent voor de EnergieBuddy app. " +
            "Antwoord in het Nederlands, kort en praktisch. " +
            "Gebruik de meegegeven gebruikerscontext alleen als dat helpt. " +
            "Geef geen juridische of medische claims."
        },
        {
          role: "system",
          content: `Context: ${JSON.stringify(context)}`
        },
        {
          role: "user",
          content: message.trim()
        }
      ],
      temperature: 0.5
    });

    const reply = response.choices?.[0]?.message?.content?.trim() || "Ik kon geen antwoord genereren.";
    return json(200, { reply });
  } catch (error) {
    console.error("chat error", error);
    return serverError("De AI kon niet antwoorden.");
  }
}
