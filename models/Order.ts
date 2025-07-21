/**
 * @file Defines the Mongoose schema and model for the "Order" collection.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IOrderItem {
  book: Types.ObjectId;
  title: string;
  author: string;
  quantity: number;
  priceAtPurchase: number;
  coverImage: string;
  downloadUrl: string;
}

/**
 * NEW: Defines the structure for the payment details sub-document.
 */
export interface IPaymentDetails {
  method: string;
  transactionId: string;
  status: 'Pending' | 'Success' | 'Failed';
  paidAt?: Date;
}

/**
 * Represents a customer's order document as stored in the MongoDB collection.
 */
export interface IOrder extends Document {
  customId: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  /**
   * The status of the order itself (fulfillment).
   */
  status: 'Pending' | 'Completed' | 'Cancelled'; // 'Paid' is now part of paymentDetails
  /**
   * NEW: An object containing all payment-related information.
   */
  paymentDetails?: IPaymentDetails;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema<IOrderItem> = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1.'] },
    priceAtPurchase: { type: Number, required: true },
    coverImage: { type: String, required: true },
    downloadUrl: { type: String, required: false },
  },
  { _id: false }
);

/**
 * NEW: Defines the schema for the PaymentDetails sub-document.
 */
const PaymentDetailsSchema: Schema<IPaymentDetails> = new Schema(
  {
    method: { type: String, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Success', 'Failed'], required: true },
    paidAt: { type: Date },
  },
  { _id: false }
);

const OrderSchema: Schema<IOrder> = new Schema(
  {
    customId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Pending',
      required: true,
      index: true,
    },
    paymentDetails: PaymentDetailsSchema, 
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;