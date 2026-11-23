import { createRemoteJWKSet, jwtVerify } from "jose";
import { errorResponse } from "./http";

export interface AccessEnv {
  /** e.g. "temple.cloudflareaccess.com" — set when Cloudflare Access protects the reports. */
  ACCESS_TEAM_DOMAIN?: string;
  /** The Access application's Audience (AUD) tag. */
  ACCESS_AUD?: string;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksDomain = "";

function tokenFrom(request: Request): string | null {
  const header = request.headers.get("Cf-Access-Jwt-Assertion");
  if (header) return header;
  const cookie = request.headers.get("Cookie") ?? "";
  return cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1] ?? null;
}

/**
 * Protects coordinator endpoints. When Cloudflare Access is configured, the request must carry
 * a valid Access token for this application; Access also blocks unauthenticated users at the edge,
 * so this is a second check in case the Access policy is ever misconfigured.
 *
 * Returns null when the request may continue, or an error response to send back.
 * With no Access settings the endpoints stay open, which suits the demo deployment.
 */
export async function requireCoordinator(request: Request, env: AccessEnv): Promise<Response | null> {
  const domain = env.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const aud = env.ACCESS_AUD;
  if (!domain || !aud) return null;

  const token = tokenFrom(request);
  if (!token) return errorResponse(401, "Sign in as a kitchen coordinator to view reports.");

  if (!jwks || jwksDomain !== domain) {
    jwks = createRemoteJWKSet(new URL(`https://${domain}/cdn-cgi/access/certs`));
    jwksDomain = domain;
  }
  try {
    await jwtVerify(token, jwks, { issuer: `https://${domain}`, audience: aud });
    return null;
  } catch {
    return errorResponse(403, "Your sign-in has expired or is not allowed. Reload the page to sign in again.");
  }
}
