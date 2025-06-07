"use client";

import Image from "next/image";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BookCard } from "@/components/books/BookCard";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import type { IBook } from "@/models/Book";

interface BookDetailClientProps {
  book: IBook;
  relatedBooks: IBook[];
}

export function BookDetailClient({
  book,
  relatedBooks,
}: BookDetailClientProps) {
  const { addToCart } = useCart();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
        <motion.div
          className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={book.coverImage}
            alt={book.title}
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
          <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2">
            {book.title}
          </h1>
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

          <Button
            size="lg"
            onClick={() => addToCart({ ...book, _id: book._id.toString() })}
            className="w-full md:w-auto mb-8 shadow-md rounded-xl text-lg"
          >
            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
          </Button>

          <div className="space-y-4">
            <h2 className="text-2xl font-headline font-semibold">Synopsis</h2>
            <div className="prose prose-lg max-w-none text-foreground/80 dark:prose-invert">
              {/* Split synopsis by newlines to render as paragraphs */}
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
          <h2 className="text-3xl font-headline font-bold mb-8 text-center">
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
