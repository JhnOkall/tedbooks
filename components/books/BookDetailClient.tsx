/**
 * @file This file defines the `BookDetailClient` component, a client-side component
 * that renders the main content of a book's detail page. It handles user interactions
 * like adding a book to the cart and displays related books.
 */

"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BookCard } from "@/components/books/BookCard";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import type { IBook } from "@/models/Book";
import { JSX } from "react";

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
 * price, and an "Add to Cart" button. It also displays a list of related books.
 * This is a client component to allow for interactivity and animations.
 *
 * @param {BookDetailClientProps} props - The props for the component.
 * @returns {JSX.Element} The rendered book detail page content.
 */
export function BookDetailClient({
  book,
  relatedBooks,
}: BookDetailClientProps): JSX.Element {
  const { addToCart } = useCart();

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
            priority // Prioritizes loading this image, as it's likely the Largest Contentful Paint (LCP) element.
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

          {/* TODO: The currency symbol 'Ksh.' is hardcoded. This should be dynamic,
          perhaps from a configuration file or a localization context, to support other currencies. */}
          <p className="text-3xl font-semibold text-primary mb-6">
            Ksh. {book.price.toFixed(2)}
          </p>

          <Button
            size="lg"
            // The `addToCart` function expects a plain object with `_id` as a string.
            // The `book` prop from the server has `_id` as a Mongoose ObjectId, so it's converted here.
            onClick={() => addToCart({ ...book, _id: book._id.toString() })}
            className="w-full md:w-auto mb-8 shadow-md rounded-lg text-lg"
          >
            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
          </Button>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Synopsis</h2>
            {/* Using Tailwind's 'prose' classes for clean typography styling of the synopsis content. */}
            <div className="prose prose-lg max-w-none text-foreground/80 dark:prose-invert">
              {/* Renders each line of the synopsis as a separate paragraph for proper spacing. */}
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
                // The BookCard component expects the book `_id` to be a string.
                book={{ ...relatedBook, _id: relatedBook._id.toString() }}
              />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
