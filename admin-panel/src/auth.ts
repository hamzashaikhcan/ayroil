import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ROLES, type Role } from "@consts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name?: string | null; role: Role };
  }
}

declare module "@auth/core/jwt" {
  interface JWT { id?: string; role?: Role; }
}

/**
 * Admin-console Auth.js instance.
 *
 * Uses AUTH_SECRET_ADMIN and an admin-scoped cookie name. Only users with
 * the admin role can sign in. The minted JWT carries an admin audience
 * claim so the backend lets it touch admin-only routes.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET_ADMIN,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs-admin.session-token"
        : "authjs-admin.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_URL}/auth/verify-credentials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });
        if (!res.ok) return null;
        const user = (await res.json()) as { id: string; email: string; name: string | null; role: Role };
        if (user.role !== ROLES.ADMIN) return null;
        return { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role ?? ROLES.USER;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      if (typeof token.role === "string") session.user.role = token.role as Role;
      return session;
    },
    async authorized({ auth }) {
      return auth?.user.role === ROLES.ADMIN;
    },
  },
});
