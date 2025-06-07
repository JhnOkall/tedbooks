/**
 * @file Defines the Mongoose schema and model for the "Cart" collection.
 * This schema manages the shopping cart for each user, linking users to the
 * books they intend to purchase.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Represents a single item within the shopping cart as a sub-document.
 * This is not a standalone model but is embedded within the `ICart` document.
 */
export interface ICartItem {
  /**
   * A reference to the unique `_id` of a document in the 'Book' collection.
   */
  book: Types.ObjectId;

  /**
   * The number of units for the specified book in the cart.
   */
  quantity: number;
}

/**
 * Represents a user's shopping cart document as stored in the MongoDB collection.
 */
export interface ICart extends Document {
  /**
   * A reference to the unique `_id` of the user who owns this cart.
   */
  user: Types.ObjectId;

  /**
   * An array of items currently in the cart.
   */
  items: ICartItem[];

  /**
   * Timestamp indicating when the cart was created. Automatically managed by Mongoose.
   */
  createdAt: Date;

  /**
   * Timestamp indicating when the cart was last updated. Automatically managed by Mongoose.
   */
  updatedAt: Date;
}

/**
 * Defines the schema for the `ICartItem` sub-document.
 */
const CartItemSchema: Schema<ICartItem> = new Schema(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book', // Establishes a reference to the 'Book' model for population.
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1.'],
    },
  },
  {
    /**
     * Prevents Mongoose from creating a unique `_id` for each cart item sub-document.
     * This is suitable as items are always accessed via the parent cart document.
     */
    _id: false,
  }
);

/**
 * Defines the schema for the main Cart model.
 */
const CartSchema: Schema<ICart> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Establishes a reference to the 'User' model.
      required: true,
      unique: true, // Ensures each user has only one cart, and creates a unique index for fast lookups.
    },
    items: [CartItemSchema], // Embeds an array of documents conforming to the CartItemSchema.
  },
  {
    /**
     * Automatically adds `createdAt` and `updatedAt` timestamp fields to the schema.
     */
    timestamps: true,
  }
);

// TODO: Implement a TTL (Time-To-Live) index on the `updatedAt` field to automatically
// remove abandoned carts after a specified period (e.g., 30 days) to keep the collection clean.
// Example: CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

// TODO: Consider adding a Mongoose virtual property to the CartSchema to compute the
// cart's total price on the server-side. This would require populating the 'items.book'
// path to access the price of each book.

/**
 * The Mongoose model for the "Cart" collection.
 * This pattern prevents model recompilation during Next.js Hot Module Replacement (HMR)
 * by reusing the existing model if it has already been compiled.
 */
const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

export default Cart;