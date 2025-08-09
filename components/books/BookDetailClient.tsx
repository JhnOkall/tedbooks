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
  Star,
  Eye,
  Download,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// --- NEW IMPORTS FOR REVIEWS SECTION ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// --- END NEW IMPORTS ---
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

// --- MOCK DATA FOR REVIEWS ---
const mockReviews = [
  {
    id: 1,
    author: "Jane Doe",
    avatar: "https://github.com/shadcn.png", // Placeholder avatar
    rating: 5,
    date: "2 weeks ago",
    comment:
      "An absolute masterpiece! The character development was phenomenal, and the plot kept me hooked from start to finish. I couldn't put it down. Highly recommended!",
  },
  {
    id: 2,
    author: "John Smith",
    avatar: "https://i.pravatar.cc/40?u=john-smith", // Another placeholder
    rating: 4,
    date: "1 month ago",
    comment:
      "A very solid read. The world-building is intricate and believable. My only critique is that the pacing felt a bit slow in the middle, but the explosive ending more than made up for it.",
  },
  {
    id: 3,
    author: "Emily White",
    avatar: "https://i.pravatar.cc/40?u=emily-white", // And another
    rating: 5,
    date: "3 months ago",
    comment:
      "This book changed my perspective on the genre. A must-read for any fan of fantasy.",
  },
];

export function BookDetailClient({
  book,
  relatedBooks,
}: BookDetailClientProps): JSX.Element {
  const { addToCart } = useCart();
  const [isCopied, setIsCopied] = useState(false);

  // --- STATE FOR NEW REVIEW FORM ---
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");

  // Mock data for the book stats
  const mockData = {
    rating: 4.8,
    views: "15.3k",
    downloads: "2.1k",
  };

  const handleShare = async () => {
    /* ... (no changes) ... */
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReviewRating === 0 || newReviewComment.trim() === "") {
      toast.error("Please provide a rating and a comment.");
      return;
    }
    // In a real app, you would send this data to your API
    console.log({
      rating: newReviewRating,
      comment: newReviewComment,
    });
    toast.success("Thank you! Your review has been submitted.");
    // Reset form
    setNewReviewRating(0);
    setHoverRating(0);
    setNewReviewComment("");
  };

  return (
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

        {/* --- NEW REVIEWS AND COMMENTS SECTION --- */}
        <motion.section
          className="mt-16 md:mt-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Separator className="my-8" />
          <h2 className="text-3xl font-bold mb-8 text-center">
            Customer Reviews
          </h2>
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* --- Column 1: Existing Reviews --- */}
            <div className="lg:col-span-2 space-y-6">
              {mockReviews.map((review) => (
                <Card key={review.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={review.avatar} alt={review.author} />
                        <AvatarFallback>
                          {review.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-semibold">{review.author}</p>
                          <span className="text-xs text-muted-foreground">
                            {review.date}
                          </span>
                        </div>
                        <div className="flex items-center mb-2">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < review.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-muted-foreground/50"
                                }`}
                              />
                            ))}
                        </div>
                        <p className="text-sm text-foreground/80">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* --- Column 2: Submit a Review Form --- */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="rating">Your Rating</Label>
                      <div
                        className="flex items-center mt-2"
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <Star
                              key={i}
                              className="h-6 w-6 cursor-pointer"
                              fill={
                                (hoverRating || newReviewRating) > i
                                  ? "currentColor"
                                  : "none"
                              }
                              onMouseEnter={() => setHoverRating(i + 1)}
                              onClick={() => setNewReviewRating(i + 1)}
                              color={
                                (hoverRating || newReviewRating) > i
                                  ? "hsl(var(--primary))"
                                  : "hsl(var(--muted-foreground))"
                              }
                            />
                          ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="comment">Your Comment</Label>
                      <Textarea
                        id="comment"
                        placeholder="What did you think of the book?"
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        className="mt-2 min-h-[120px]"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Submit Review
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.section>
        {/* --- END OF REVIEWS SECTION --- */}

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
