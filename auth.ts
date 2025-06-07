import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import User, { IUser } from "./models/User";
import connectDB from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          await connectDB();

          const existingUser = await User.findOne({ email: profile.email });

          if (!existingUser) {
            // --- The core logic for assigning the first user as admin ---
            
            // 1. Check if any users exist in the database.
            const userCount = await User.countDocuments();

            // 2. Determine the role. If count is 0, this is the first user.
            const role = userCount === 0 ? 'admin' : 'user';

            // 3. Create the new user with the determined role.
            await User.create({
              name: profile.name,
              email: profile.email,
              image: profile.picture,
              role: role, // Use the dynamically determined role
            });
            
            console.log(`New user created with role: ${role}`);
          }
          
          return true; // Allow sign-in
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false; // Prevent sign-in on error
        }
      }
      return false; // Deny sign-in for other cases
    },

    /**
     * The `jwt` callback is called whenever a JSON Web Token is created.
     * This function remains unchanged as it correctly fetches whatever role
     * is in the database.
     */
    async jwt({ token, user }) {
      // The user object is only available on the first sign in after a new user is created
      // or an existing user logs in.
      if (user) {
        await connectDB();
        // Fetch the user from the DB to ensure we have the most up-to-date data, including the role.
        const dbUser = await User.findOne({ email: user.email });
        
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
        }
      }
      return token;
    },

    /**
     * The `session` callback remains unchanged. It correctly passes
     * the role from the JWT to the session object.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'admin';
      }
      return session;
    },
  },
});