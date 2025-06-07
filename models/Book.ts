
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Interface for the Book document 
export interface IBook extends Document {
  _id: Types.ObjectId;
  title: string;
  author: string;
  price: number;
  description: string;
  synopsis: string;
  category: string;
  coverImage: string;
  fileUrl: string; 
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema: Schema<IBook> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    synopsis: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
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

// Prevent model recompilation in Next.js HMR
const Book: Model<IBook> = mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);

export default Book;
