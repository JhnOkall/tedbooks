import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPayoutConfig extends Document {
  name: string;
  phone: string;
  payoutPercentage: number;
  payoutFrequency: 'weekly' | 'monthly';
  lastPayoutDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutConfigSchema: Schema<IPayoutConfig> = new Schema(
  {
    name: { type: String, required: true },
    phone: { 
      type: String, 
      required: true, 
      // Basic validation for Kenyan phone numbers
      match: [/^(254\d{9}|0\d{9})$/, 'Phone number must be a valid Kenyan number.'],
    },
    payoutPercentage: { type: Number, required: true, min: 0, max: 100 },
    payoutFrequency: { type: String, enum: ['weekly', 'monthly'], required: true },
    lastPayoutDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PayoutConfig: Model<IPayoutConfig> = 
  mongoose.models.PayoutConfig || mongoose.model<IPayoutConfig>('PayoutConfig', PayoutConfigSchema);

export default PayoutConfig;