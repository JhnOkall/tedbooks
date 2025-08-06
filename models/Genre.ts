/**
 * @file Defines the Mongoose schema and model for the "Genre" collection.
 * This file is responsible for the data structure, validation, and database
 * interface for genre entities in the application.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import slugify from 'slugify'; 

/**
 * Represents a genre document as stored in the MongoDB collection.
 */
export interface IGenre extends Document {

  _id: Types.ObjectId
  /**
   * The name of the genre (e.g., "Science Fiction").
   */
  name: string;

  /**
   * A URL-friendly version of the genre name (e.g., "science-fiction").
   */
  slug: string;

  /**
   * A URL for a representative image for the genre.
   */
  image: string;
}

/**
 * Defines the schema for the Genre model.
 */
const GenreSchema: Schema<IGenre> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Genre name is required.'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    image: {
      type: String,
      required: [true, 'Genre image URL is required.'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to automatically generate the slug from the name
GenreSchema.pre<IGenre>('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

/**
 * The Mongoose model for the "Genre" collection.
 */
const Genre: Model<IGenre> =
  mongoose.models.Genre || mongoose.model<IGenre>('Genre', GenreSchema);

export default Genre;