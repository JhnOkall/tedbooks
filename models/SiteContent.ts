import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISiteContent extends Document {
  key: string;      // e.g., 'aboutPageContent', 'faqContent'
  title: string;
  content: string;  // Can store plain text or Markdown
  createdAt: Date;
  updatedAt: Date;
}

const SiteContentSchema: Schema<ISiteContent> = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true, // Each key must be unique
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SiteContent: Model<ISiteContent> =
  mongoose.models.SiteContent || mongoose.model<ISiteContent>('SiteContent', SiteContentSchema);

export default SiteContent;