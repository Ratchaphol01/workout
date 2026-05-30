import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
}

const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-dev-secret");

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthPayload | null> {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const COOKIE_NAME = "auth_token";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};
