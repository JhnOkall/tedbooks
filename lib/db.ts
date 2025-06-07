/**
 * @file This module handles the database connection to MongoDB.
 * It implements a caching strategy to reuse an existing database connection
 * across multiple function invocations, which is crucial for performance in
 * serverless environments like Vercel or during local development with
 * Next.js Hot Module Replacement (HMR).
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// A critical check to ensure the application can connect to the database.
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * The `global` object is used here to maintain a cached connection across hot reloads
 * in development. This prevents the number of connections from growing exponentially.
 * In production, this ensures that the connection is reused for each serverless function
 * invocation, rather than establishing a new one every time.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached = (global as any).mongoose;

if (!cached) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = (global as any).mongoose = { conn: null, promise: null };
  // TODO: Define a proper type for the `cached` object instead of using `any`
  // to improve type safety. e.g., interface MongooseCache { conn: Mongoose | null; promise: Promise<Mongoose> | null; }
}

/**
 * Establishes a connection to the MongoDB database.
 * If a connection already exists, it returns the cached connection.
 * If a connection is in the process of being established, it waits for that promise to resolve.
 * Otherwise, it creates a new database connection.
 *
 * @returns {Promise<typeof mongoose>} A promise that resolves to the Mongoose connection instance.
 */
async function connectDB() {
  // If a connection is already cached, return it immediately.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection promise does not exist, create one.
  if (!cached.promise) {
    const opts = {
      /**
       * Mongoose buffers command execution until a connection is established.
       * Disabling this makes Mongoose fail fast if it's not connected,
       * which can be useful for debugging connection issues.
       */
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongooseInstance) => {
        // TODO: Replace console.log with a dedicated, structured logger for production environments.
        console.log('MongoDB connection established successfully.');
        return mongooseInstance;
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        throw err;
      });
  }

  try {
    // Await the connection promise and cache the connection instance.
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, nullify the promise to allow a new connection attempt on the next call.
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;