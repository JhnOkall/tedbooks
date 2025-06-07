/**
 * @file Defines the Mongoose schema and model for the "SiteContent" collection.
 * This model provides a flexible way to manage editable content blocks for the
 * website (e.g., "About Us" text, FAQs, privacy policy) without requiring code changes.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Represents a piece of site content as stored in the MongoDB collection.
 * Each document corresponds to a specific, editable block of content on the site.
 */
export interface ISiteContent extends Document {
  /**
   * A unique, programmatic identifier for the content block (e.g., 'about-us-page', 'contact-email').
   * This key is used by the application to fetch the correct content.
   */
  key: string;

  /**
   * The user-facing title for the content block.
   */
  title: string;

  /**
   * The main body of the content. This field is flexible and can store
   * plain text, Markdown, or HTML, to be parsed by the front-end.
   */
  content: string;

  /**
   * Timestamp indicating when the content was created. Automatically managed by Mongoose.
   */
  createdAt: Date;

  /**
   * Timestamp indicating when the content was last updated. Automatically managed by Mongoose.
   */
  updatedAt: Date;
}

/**
 * Defines the schema for the SiteContent model, specifying data types,
 * validation rules, and indexes.
 */
const SiteContentSchema: Schema<ISiteContent> = new Schema(
  {
    key: {
      type: String,
      required: [true, 'A unique key is required.'],
      unique: true, // Ensures no two content blocks share the same key.
      index: true, // Creates a database index for fast lookups by key.
    },
    title: {
      type: String,
      required: [true, 'A title is required.'],
    },
    content: {
      type: String,
      required: [true, 'Content cannot be empty.'],
    },
  },
  {
    /**
     * Automatically adds `createdAt` and `updatedAt` timestamp fields to the schema.
     */
    timestamps: true,
  }
);

// TODO: Consider adding a 'contentType' field (e.g., 'markdown', 'html', 'plaintext')
// to help the front-end apply the correct rendering logic for the 'content' field.

// TODO: For a more robust CMS, implement a versioning system or an audit trail
// to track changes to content over time, allowing for rollbacks.

/**
 * The Mongoose model for the "SiteContent" collection.
 * This pattern prevents model recompilation during Next.js Hot Module Replacement (HMR)
 * by reusing the existing model if it has already been compiled.
 */
const SiteContent: Model<ISiteContent> =
  mongoose.models.SiteContent ||
  mongoose.model<ISiteContent>('SiteContent', SiteContentSchema);

export default SiteContent;