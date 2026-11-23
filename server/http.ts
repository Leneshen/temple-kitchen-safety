export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export const errorResponse = (status: number, message: string, details?: string[]): Response =>
  json({ error: message, ...(details ? { details } : {}) }, status);

const MAX_BODY_BYTES = 16 * 1024;

/** Reads a JSON body, rejecting anything too large or not JSON. */
export async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return { ok: false, response: errorResponse(415, "Send the report as JSON.") };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return { ok: false, response: errorResponse(413, "Report is too large.") };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: errorResponse(400, "Request body is not valid JSON.") };
  }
}
