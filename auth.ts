/**
 * @file Next.js authentication configuration using NextAuth.js.
 * This file sets up authentication providers, session management strategy,
 * and custom callbacks to handle user provisioning and session enrichment.
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import User from '@/models/User';
import connectDB from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  /**
   * Configures the authentication providers. Currently, only Google is enabled.
   */
  providers: [Google],

  /**
   * Defines the session management strategy.
   * "jwt" uses JSON Web Tokens for session management, which is a stateless approach
   * suitable for serverless environments.
   */
  session: {
    strategy: 'jwt',
  },

  /**
   * Callbacks for customizing the default behavior of NextAuth.
   */
  callbacks: {
    /**
     * Invoked on a successful sign-in attempt. This callback handles the
     * "Just-In-Time" provisioning of users in the database.
     *
     * @param {object} params - The parameters for the signIn callback.
     * @param {User} params.user - The user object from the provider.
     * @param {Account} params.account - The account object from the provider.
     * @param {Profile} params.profile - The profile object from the provider.
     * @returns {boolean} - Returns `true` to allow sign-in, `false` to deny.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          await connectDB();

          const existingUser = await User.findOne({ email: profile.email });

          if (!existingUser) {
            // Determine if any users already exist in the database.
            const userCount = await User.countDocuments();

            // The first user to sign up is automatically granted administrator privileges.
            // All subsequent users are assigned the standard 'user' role.
            const role = userCount === 0 ? 'admin' : 'user';

            // Create a new user record in the database.
            await User.create({
              name: profile.name,
              email: profile.email,
              image: profile.picture,
              role: role,
            });
          }
          // Allow the sign-in to proceed.
          return true;
        } catch (error) {
          // Log the error and prevent sign-in if a database error occurs.
          console.error('Error during signIn callback:', error);
          // TODO: Implement a more robust error handling and logging strategy,
          // potentially using a dedicated logging service instead of console.error.
          return false;
        }
      }
      // Deny sign-in if the provider is not Google or if the profile email is missing.
      return false;
    },

    /**
     * Invoked whenever a JSON Web Token is created or updated.
     * This callback is used to persist custom data (like user ID and role) in the JWT.
     *
     * @param {object} params - The parameters for the jwt callback.
     * @param {JWT} params.token - The current JWT.
     * @param {User} params.user - The user object (only available on initial sign-in).
     * @returns {JWT} The modified token.
     */
    async jwt({ token, user }) {
      // On initial sign-in, the 'user' object is available.
      // We use it to fetch the user's details from the database.
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });

        if (dbUser) {
          // Persist the database ID and role into the token.
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          // TODO: The role strings 'admin' and 'user' are hardcoded here and in the
          // signIn callback. Centralize these into a shared enum or constants file
          // for better maintainability and type safety.
        }
      }
      return token;
    },

    /**
     * Invoked whenever a session is checked.
     * This callback is used to pass custom data from the token to the client-side
     * session object.
     *
     * @param {object} params - The parameters for the session callback.
     * @param {Session} params.session - The current session object.
     * @param {JWT} params.token - The JWT from the jwt callback.
     * @returns {Session} The updated session object.
     */
    async session({ session, token }) {
      // Add the custom properties from the token to the session.user object.
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'admin';
      }
      return session;
    },
  },
});