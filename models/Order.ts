
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Interface for OrderItem sub-document
export interface IOrderItem {
  book: Types.ObjectId; // Reference to Book._id
  title: string; // Denormalized
  author: string; // Denormalized
  quantity: number;
  priceAtPurchase: number;
  coverImage: string; // Denormalized
  downloadUrl: string;
}

// Interface for the Order document
export interface IOrder extends Document {
  customId: string;  
  user: Types.ObjectId; 
  items: IOrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  paymentProvider?: string; // e.g., 'payhero'
  providerReference?: string; // The transaction reference from the payment provider
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema<IOrderItem> = new Schema({
  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  title: { // Denormalized from Book at time of purchase
    type: String,
    required: true,
  },
  author: { // Denormalized from Book
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  priceAtPurchase: { // Price of the book at the time of order
    type: Number,
    required: true,
  },
  coverImage: { // Denormalized from Book
    type: String,
    required: true,
  },
  downloadUrl: {
    type: String,
  },
}, {_id: false}); // OrderItems are subdocuments, no separate _id needed unless explicitly desired

const OrderSchema: Schema<IOrder> = new Schema(
  {
    customId: { // For business logic order identifier like "ORD-XYZ"
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    },
    paymentProvider: { 
      type: String,
    },
    providerReference: { 
        type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt (order date) and updatedAt
  }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
