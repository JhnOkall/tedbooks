/**
 * @file Augments the default 'next-auth' types to include custom properties
 * in the session, user, and JWT objects. This is essential for type-safety
 * when working with custom user data like database IDs and roles.
 */

import 'next-auth';
import { JWT } from 'next-auth/jwt';

// TODO: To improve maintainability, consider centralizing the role definitions
// into a shared enum or type alias (e.g., `export type UserRole = 'user' | 'admin';`)
// that can be imported and used throughout the application.

declare module 'next-auth' {
  /**
   * Defines the shape of the session object, which is returned by `useSession()`
   * and `getSession()`. This declaration extends the default session to include
   * custom user properties.
   */
  interface Session {
    user: {
      /**
       * The user's unique identifier from the database (e.g., MongoDB `_id`).
       */
      id: string;

      /**
       * The user's role, used for implementing access control.
       */
      role: 'user' | 'admin';
    } & DefaultSession['user']; // Merges with the default user properties (name, email, image).
  }

  /**
   * Defines the custom properties on the User object, which is returned by
   * the `authorize` callback in the credentials provider or from an OAuth provider profile.
   */
  interface User {
    /**
     * The user's role, assigned during registration or by an administrator.
     */
    role: 'user' | 'admin';

    /**
     * The unique identifier for the user from the database.
     */
    id: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Defines the custom properties of the JSON Web Token. The properties declared
   * here are encoded into the JWT and are available in the `token` parameter
   * of the `jwt` and `session` callbacks.
   */
  interface JWT {
    /**
     * The user's unique database identifier, persisted in the token.
     */
    id: string;

    /**
     * The user's role, persisted in the token for session management.
     */
    role: 'user' | 'admin';
  }
}