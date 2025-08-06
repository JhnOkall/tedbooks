/**
 * @file Defines the Mongoose schema and model for the "Book" collection.
 * This file is responsible for the data structure, validation, and database
 * interface for book entities in the application.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Import the IGenre interface to use for population typing
import { IGenre } from './Genre';

/**
 * Represents a book document as stored in the MongoDB collection.
 * Includes all properties of a book and Mongoose document extensions.
 */
export interface IBook extends Document {
  _id: Types.ObjectId;
  title: string;
  author: string;
  price: number;
  filePublicId: string;
  description: string;
  synopsis: string;
  /**
   * A reference to the book's genre document.
   * Can be a `Types.ObjectId` or a populated `IGenre` document.
   */
  genre: Types.ObjectId | IGenre;
  coverImage: string;
  fileUrl: string;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Defines the schema for the Book model, specifying data types, validation rules,
 * and other constraints for book documents.
 */
const BookSchema: Schema<IBook> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required.'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required.'],
      min: [0, 'Price cannot be negative.'],
    },
    filePublicId: { type: String, required: true },
    description: {
      type: String,
      required: [true, 'Description is required.'],
    },
    synopsis: {
      type: String,
      required: [true, 'Synopsis is required.'],
    },
    // --- MODIFICATION START ---
    // The genre field is now a reference to the Genre collection.
    genre: {
      type: Schema.Types.ObjectId,
      ref: 'Genre', // This tells Mongoose which model to use during population
      required: [true, 'Genre is required.'],
    },
    // --- MODIFICATION END ---
    coverImage: {
      type: String,
      required: [true, 'Cover image URL is required.'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required.'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add an index to the new genre field for faster queries
BookSchema.index({ genre: 1 });
BookSchema.index({ title: 'text', author: 'text' });

/**
 * The Mongoose model for the "Book" collection.
 */
const Book: Model<IBook> =
  mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);

export default Book;