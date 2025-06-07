import 'next-auth';
import { JWT } from 'next-auth/jwt';

// Extend the built-in session and user types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // This is the MongoDB _id
      role: 'user' | 'admin';
    } & DefaultSession['user']; // Keep the default properties
  }

  interface User {
    // Add your custom properties here
    role: 'user' | 'admin';
    id: string; // This is how we'll refer to the MongoDB _id
  }
}

// Extend the JWT type to include our custom properties
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'user' | 'admin';
  }
}