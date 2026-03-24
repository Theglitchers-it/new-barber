import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { compareSync } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations/auth"
import { loginLimiter } from "@/lib/rate-limit"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 days
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { success } = loginLimiter.check(5, parsed.data.email)
        if (!success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        // Always run bcrypt to prevent timing-based email enumeration
        const dummyHash = "$2a$12$000000000000000000000uGTWY8MYl5F0MI7Ht5CXVBks0tzSvWay"
        const hash = user?.hashedPassword || dummyHash
        const isValid = compareSync(parsed.data.password, hash)
        if (!isValid || !user) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Check if a credentials-based account already exists with this email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { hashedPassword: true },
        })

        // If user registered with password, block Google auto-linking to prevent hijack
        if (existingUser?.hashedPassword) {
          return false
        }

        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
            role: "CLIENT",
          },
        })
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "credentials") {
          token.id = user.id
          token.role = (user as { role?: string }).role ?? "CLIENT"
        } else if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true },
          })
          token.id = dbUser?.id ?? user.id
          token.role = dbUser?.role ?? "CLIENT"
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
