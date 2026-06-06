import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

function allowedEmails(): string[] {
  return (process.env.ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    signIn({ user }) {
      const allowed = allowedEmails();
      if (!allowed.length) return false;
      return !!user.email && allowed.includes(user.email.toLowerCase());
    },
  },
  secret: process.env.AUTH_SECRET,
});
