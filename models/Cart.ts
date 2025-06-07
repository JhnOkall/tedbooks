import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// This sub-document stores the items within a cart
export interface ICartItem {
  book: Types.ObjectId; // Reference to the Book
  quantity: number;
}

// The main cart document linked to a user
export interface ICart extends Document {
  user: Types.ObjectId; // Reference to the User
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema: Schema<ICartItem> = new Schema({
  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
}, {_id: false});


const CartSchema: Schema<ICart> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each user can only have one cart
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

export default Cart;