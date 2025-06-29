/**
 * Defines the structure for a book object.
 */
export interface Book {
  /**
   * Unique identifier for the book, typically generated by the database.
   */
  _id: string;

  /**
   * The title of the book.
   */
  title: string;

  /**
   * The author of the book.
   */
  author: string;

  /**
   * The price of the book.
   */
  price: number;

  /**
   * A brief summary for display in list or card views.
   */
  description: string;

  /**
   * A detailed synopsis for the book's dedicated details page.
   */
  synopsis: string;

  /**
   * The category or genre of the book.
   */
  category: string;

  /**
   * URL for the book's cover image.
   */
  coverImage: string;

  /**
   * Optional flag to indicate if the book is featured.
   * @default false
   */
  featured?: boolean;

  // TODO: Consider adding an 'isbn' field for standardized book identification and easier integration with external APIs.
}

/**
 * Represents a book item within the shopping cart, extending the base Book
 * interface with a quantity.
 */
export interface CartItem extends Book {
  /**
   * The number of units of this book in the cart.
   */
  quantity: number;
}

/**
 * Defines the structure for a user's profile data.
 */
export interface UserProfile {
  /**
   * Unique identifier for the user.
   */
  _id: string;

  /**
   * The user's full name.
   */
  name: string;

  /**
   * The user's email address, used for login and communication.
   */
  email: string;

  /**
   * URL for the user's profile picture.
   */
  image: string;

  /**
   * The user's phone number.
   */
  phone?: string;

  /**
   * Defines the user's access level and permissions within the system.
   */
  role: 'user' | 'admin';
}

/**
 * Represents a single line item within a customer's order.
 * This contains denormalized book data to preserve order history accurately.
 */
export interface OrderItem {
  /**
   * Unique identifier for the order item.
   */
  _id: string;

  /**
   * The ID of the book purchased. References the 'Book' collection.
   */
  bookId: string;

  /**
   * The title of the book at the time of purchase.
   */
  title: string;

  /**
   * The author of the book at the time of purchase.
   */
  author: string;

  /**
   * The quantity of the book purchased.
   */
  quantity: number;

  /**
   * The price of a single unit of the book at the time of purchase.
   */
  priceAtPurchase: number;

  /**
   * The cover image URL of the book at the time of purchase.
   */
  coverImage: string;

  /**
   * The URL from which the digital book can be downloaded.
   */
  downloadUrl: string;

  // TODO: Implement a mechanism for generating secure, time-limited download URLs to protect digital assets.
}

/**
 * Defines the structure for a customer's order.
 */
export interface Order {
  /**
   * Unique identifier for the order.
   */
  _id: string;

  /**
   * A human-readable, unique identifier for the order (e.g., ORD-2024-12345).
   */
  customId: string;

  /**
   * The ID of the user who placed the order. References the 'UserProfile' collection.
   */
  userId: string;

  /**
   * ISO 8601 formatted date-time string indicating when the order was created.
   */
  date: string;

  /**
   * The total calculated amount for the entire order.
   */
  totalAmount: number;

  /**
   * The current processing status of the order.
   */
  status: 'Pending' | 'Completed' | 'Cancelled';

  /**
   * An array of all items included in the order.
   */
  items: OrderItem[];

  // TODO: Add a 'paymentIntentId' field to link the order with a transaction from a payment provider like Stripe.
}