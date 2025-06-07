
export interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  description: string; // short summary for card
  synopsis: string; // longer description for detail page
  category: string;
  coverImage: string; 
  featured?: boolean;
}

export interface CartItem extends Book {
  quantity: number;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image: string;
  phone?: string;
  role: 'user' | 'admin'; // Role can be 'user' or 'admin'
}

export interface OrderItem {
  _id: string; // Unique identifier for the order item
  bookId: string;
  title: string;
  author: string;
  quantity: number;
  priceAtPurchase: number; // Price at the time of purchase
  coverImage: string;
  downloadUrl: string; 
}

export interface Order {
  _id: string;
  customId: string; 
  userId: string;
  date: string; // ISO date string, e.g., "2024-07-28T10:00:00Z"
  totalAmount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  items: OrderItem[];
}
