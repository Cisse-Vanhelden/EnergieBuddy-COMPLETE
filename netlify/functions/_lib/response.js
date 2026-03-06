export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

export function badRequest(message) {
  return json(400, { error: message });
}

export function unauthorized(message = "Niet geautoriseerd.") {
  return json(401, { error: message });
}

export function serverError(message = "Er ging iets mis op de server.") {
  return json(500, { error: message });
}
