import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import pool from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing email or password in credentials');
          return null;
        }

        try {
          const client = await pool.connect();
          try {
            const result = await client.query(
              'SELECT * FROM users WHERE email = $1',
              [credentials.email]
            );

            if (result.rows.length === 0) {
              console.error('User not found:', credentials.email);
              return null;
            }

            const user = result.rows[0];
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

            if (!isPasswordValid) {
              console.error('Invalid password for user:', credentials.email);
              return null;
            }

            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
            };
          } finally {
            client.release();
          }
        } catch (error) {
          console.error('Database error during authentication:', error);
          return null;
        }
      }
    }),
    // Google OAuth - Only include if credentials are provided
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : [])
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
