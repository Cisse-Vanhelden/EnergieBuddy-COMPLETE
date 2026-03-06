import { clearAuthCookie } from "./_lib/auth.js";

export async function handler() {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearAuthCookie()
    },
    body: JSON.stringify({ ok: true })
  };
}
