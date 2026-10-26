import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Role, UserSession } from "@/types";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "minetrack-default-super-secret-jwt-key-2026"
);

const COOKIE_NAME = "minetrack_session";

export async function createSessionToken(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function authenticateUser(email: string, passwordPlain: string): Promise<{ success: boolean; user?: UserSession; token?: string; error?: string }> {
  const user = db.findUserByEmail(email);
  if (!user) {
    return { success: false, error: "Email atau kata sandi tidak valid." };
  }

  if (!user.isActive) {
    return { success: false, error: "Akun Anda telah dinonaktifkan. Hubungi Administrator." };
  }

  const isValidPassword = bcrypt.compareSync(passwordPlain, user.passwordHash);
  if (!isValidPassword) {
    return { success: false, error: "Email atau kata sandi tidak valid." };
  }

  const sessionData: UserSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    siteIds: user.siteAccesses?.map((s) => s.siteId) || [],
  };

  const token = await createSessionToken(sessionData);
  return { success: true, user: sessionData, token };
}

export async function loginUser(email: string, passwordPlain: string): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  const auth = await authenticateUser(email, passwordPlain);
  if (!auth.success || !auth.user || !auth.token) {
    return { success: false, error: auth.error };
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, auth.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  } catch {
    // Graceful fallback when called outside Next.js request context (e.g. Unit tests)
  }

  return { success: true, user: auth.user };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]): Promise<UserSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    // Redirect to user's assigned role dashboard
    const rolePath = getRoleDefaultPath(session.role);
    redirect(rolePath);
  }
  return session;
}

export function getRoleDefaultPath(role: Role): string {
  switch (role) {
    case "ADMINISTRATOR":
      return "/admin/dashboard";
    case "SUPERVISOR":
      return "/supervisor/dashboard";
    case "OPERATOR":
      return "/operator/dashboard";
    case "MANAGEMENT":
      return "/management/dashboard";
    default:
      return "/login";
  }
}
