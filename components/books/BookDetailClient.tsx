/**
 * @file This file defines the `BookDetailClient` component, a client-side component
 * that renders the main content of a book's detail page. It handles user interactions
 * like adding a book to the cart, sharing the page, and displays related books.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Tag, Share2, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BookCard } from "@/components/books/BookCard";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import type { IBook } from "@/models/Book";
import { JSX } from "react";
import { toast } from "sonner";

/**
 * Defines the props required by the `BookDetailClient` component.
 */
interface BookDetailClientProps {
  /** The main book object to display, conforming to the Mongoose IBook interface. */
  book: IBook;
  /** An array of related books to be displayed in a "You Might Also Like" section. */
  relatedBooks: IBook[];
}

/**
 * Renders the detailed view for a single book, including its cover, synopsis,
 * price, and interactive buttons for adding to cart and sharing.
 * It also displays a list of related books.
 * This is a client component to allow for interactivity and browser APIs.
 *
 * @param {BookDetailClientProps} props - The props for the component.
 * @returns {JSX.Element} The rendered book detail page content.
 */
export function BookDetailClient({
  book,
  relatedBooks,
}: BookDetailClientProps): JSX.Element {
  const { addToCart } = useCart();
  const [isCopied, setIsCopied] = useState(false);

  /**
   * Handles the share action. It uses the Web Share API on supported devices (mobile)
   * and falls back to copying the link to the clipboard on other devices (desktop).
   */
  const handleShare = async () => {
    const shareData = {
      title: book.title,
      text: `Check out "${book.title}" by ${book.author} on TedBooks!`,
      // window.location.href gets the full, current URL of the page.
      url: window.location.href,
    };

    // Check if the Web Share API is available in the browser
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log("Book shared successfully!");
      } catch (err) {
        // Log error if user cancels share or an error occurs
        console.error("Share failed:", err);
      }
    } else {
      // Fallback for desktop: copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        // Reset the "Copied!" feedback message after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
        toast("Failed to copy link to clipboard.");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* Animated container for the book cover image */}
        <motion.div
          className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Animated container for the book's textual information */}
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{book.title}</h1>
          <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>

          <div className="flex items-center space-x-2 mb-6">
            <Tag className="h-5 w-5 text-primary" />
            <span className="text-md font-medium text-primary">
              {book.category}
            </span>
          </div>

          <p className="text-3xl font-semibold text-primary mb-6">
            Ksh. {book.price.toFixed(2)}
          </p>

          {/* Action buttons container */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <Button
              size="lg"
              onClick={() => addToCart({ ...book, _id: book._id.toString() })}
              className="w-full sm:w-auto shadow-md rounded-lg text-lg flex-grow"
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleShare}
              disabled={isCopied} // Disable button briefly after copying
              className="w-full sm:w-auto shadow-md rounded-lg text-lg"
            >
              {isCopied ? (
                <>
                  <Check className="mr-2 h-5 w-5 text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-5 w-5" /> Share
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Synopsis</h2>
            <div className="prose prose-lg max-w-none text-foreground/80 dark:prose-invert">
              {book.synopsis.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Conditionally renders the "Related Books" section if there are any. */}
      {relatedBooks.length > 0 && (
        <motion.section
          className="mt-16 md:mt-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Separator className="my-8" />
          <h2 className="text-3xl font-bold mb-8 text-center">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {relatedBooks.map((relatedBook) => (
              <BookCard
                key={relatedBook._id.toString()}
                book={{ ...relatedBook, _id: relatedBook._id.toString() }}
              />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
