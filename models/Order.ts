/**
 * @file Defines the Mongoose schema and model for the "Order" collection.
 * This schema captures all details of a customer's purchase, including the items,
 * total amount, status, and payment information.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Represents a single item within an order as a sub-document.
 * It contains denormalized data from the `Book` model to ensure that order
 * history remains accurate and immutable, even if book details change later.
 */
export interface IOrderItem {
  /**
   * A reference to the `_id` of the purchased book in the 'Book' collection.
   */
  book: Types.ObjectId;

  /**
   * The title of the book at the time of purchase. Stored to prevent historical
   * data from changing if the book's title is updated.
   */
  title: string;

  /**
   * The author of the book at the time of purchase.
   */
  author: string;

  /**
   * The quantity of this specific book purchased in the order.
   */
  quantity: number;

  /**
   * The price per unit of the book at the time of purchase.
   */
  priceAtPurchase: number;

  /**
   * The cover image URL of the book at the time of purchase.
   */
  coverImage: string;

  /**
   * The URL from which the digital book can be downloaded.
   */
  // TODO: Implement a system for generating secure, time-limited download URLs
  // instead of storing a static URL, to protect the digital asset.
  downloadUrl: string;
}

/**
 * Represents a customer's order document as stored in the MongoDB collection.
 */
export interface IOrder extends Document {
  /**
   * A unique, human-readable identifier for the order (e.g., "ORD-2024-ABCDE").
   */
  customId: string;

  /**
   * A reference to the `_id` of the user who placed the order.
   */
  user: Types.ObjectId;

  /**
   * An array of all items included in the order.
   */
  items: IOrderItem[];

  /**
   * The total calculated amount for the entire order.
   */
  totalAmount: number;

  /**
   * The current processing status of the order.
   */
  status: 'Pending' | 'Completed' | 'Cancelled';

  /**
   * The name of the payment provider used for the transaction (e.g., 'stripe', 'paypal').
   */
  paymentProvider?: string;

  /**
   * The transaction ID or reference from the external payment provider.
   */
  providerReference?: string;

  /**
   * Timestamp indicating when the order was created. Automatically managed by Mongoose.
   */
  createdAt: Date;

  /**
   * Timestamp indicating when the order was last updated. Automatically managed by Mongoose.
   */
  updatedAt: Date;
}

/**
 * Defines the schema for the `IOrderItem` sub-document.
 */
const OrderItemSchema: Schema<IOrderItem> = new Schema(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1.'],
    },
    priceAtPurchase: {
      type: Number,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    downloadUrl: {
      type: String,
      required: false, // May not be available until payment is confirmed.
    },
  },
  {
    /**
     * Prevents Mongoose from creating a separate `_id` for these sub-documents,
     * as they are intrinsically part of the parent Order document.
     */
    _id: false,
  }
);

/**
 * Defines the schema for the main Order model.
 */
const OrderSchema: Schema<IOrder> = new Schema(
  {
    customId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Creates an index for fast lookups by custom ID.
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Creates an index for efficient querying of a user's orders.
    },
    items: [OrderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Pending',
      required: true,
      index: true, // Creates an index for efficiently filtering orders by status.
    },
    paymentProvider: {
      type: String,
    },
    providerReference: {
      type: String,
    },
  },
  {
    /**
     * Automatically adds `createdAt` and `updatedAt` timestamp fields.
     */
    timestamps: true,
  }
);

// TODO: Implement a pre-save hook on the OrderSchema to reliably generate the `customId`
// and calculate the `totalAmount` based on the items array to ensure data integrity.

/**
 * The Mongoose model for the "Order" collection.
 * This pattern prevents model recompilation during Next.js Hot Module Replacement (HMR).
 */
const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;