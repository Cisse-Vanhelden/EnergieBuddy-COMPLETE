import jwt from "jsonwebtoken";
import "dotenv/config";

const TOKEN_NAME = "energiebuddy_token";
const ONE_WEEK = 60 * 60 * 24 * 7;

export function signUser(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      display_name: user.display_name
    },
    process.env.JWT_SECRET,
    { expiresIn: ONE_WEEK }
  );
}

export function parseCookies(cookieHeader = "") {
  const out = {};
  cookieHeader.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return;
    out[key] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

export function getUserFromEvent(event) {
  try {
    const cookies = parseCookies(event.headers?.cookie || event.headers?.Cookie || "");
    const token = cookies[TOKEN_NAME];
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function authCookie(token) {
  return `${TOKEN_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ONE_WEEK}`;
}

export function clearAuthCookie() {
  return `${TOKEN_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
