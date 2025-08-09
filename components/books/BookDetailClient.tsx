/**
 * @file This file defines the `BookDetailClient` component, a client-side component
 * that renders the main content of a book's detail page. It handles user interactions
 * like adding a book to the cart, sharing the page, and displays related books.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Tag,
  Share2,
  Check,
  Star, // <-- Import new icons
  Eye,
  Download,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // <-- Import Tooltip components
import { useCart } from "@/context/CartContext";
import { BookCard } from "@/components/books/BookCard";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import type { Book } from "@/types";
import { JSX } from "react";
import { toast } from "sonner";

interface BookDetailClientProps {
  book: Book;
  relatedBooks: Book[];
}

export function BookDetailClient({
  book,
  relatedBooks,
}: BookDetailClientProps): JSX.Element {
  const { addToCart } = useCart();
  const [isCopied, setIsCopied] = useState(false);

  // Mock data for the new fields
  const mockData = {
    rating: 4.8,
    views: "15.3k",
    downloads: "2.1k",
  };

  const handleShare = async () => {
    const shareData = {
      title: book.title,
      text: `Check out "${book.title}" by ${book.author} on TedBooks!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
        toast.error("Failed to copy link to clipboard.");
      }
    }
  };

  return (
    // Wrap the entire component in a TooltipProvider
    <TooltipProvider delayDuration={200}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
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

          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {book.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              by {book.author}
            </p>

            <div className="flex items-center space-x-2 mb-6">
              <Tag className="h-5 w-5 text-primary" />
              <Link
                href={`/shop?genre=${book.genre.slug}`}
                className="text-md font-medium text-primary hover:underline transition-colors"
              >
                {book.genre.name}
              </Link>
            </div>

            {/* --- NEW META DATA SECTION --- */}
            <div className="flex items-center gap-6 text-muted-foreground mb-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-default">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                    <span className="font-medium text-foreground">
                      {mockData.rating}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Average Rating</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-default">
                    <Eye className="h-5 w-5" />
                    <span className="font-medium text-foreground">
                      {mockData.views}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total Views</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-default">
                    <Download className="h-5 w-5" />
                    <span className="font-medium text-foreground">
                      {mockData.downloads}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total Downloads</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {/* --- END OF NEW SECTION --- */}

            <p className="text-3xl font-semibold text-primary mb-6">
              Ksh. {book.price.toFixed(2)}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              <Button
                size="lg"
                onClick={() => addToCart(book)}
                className="w-full sm:w-auto shadow-md rounded-lg text-lg flex-grow"
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleShare}
                disabled={isCopied}
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
            {/* THIS SECTION AUTOMATICALLY GETS THE NEW BOOK CARDS! */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {relatedBooks.map((relatedBook) => (
                <BookCard key={relatedBook._id} book={relatedBook} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </TooltipProvider>
  );
}
