/**
 * @file This file defines the `BookCard` component, a client-side component
 * responsible for displaying a single book's information in a visually appealing card format.
 * It includes the book's cover, title, author, price, and an "Add to Cart" button.
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShoppingCart, Star, Eye, Download } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import { JSX } from "react";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps): JSX.Element {
  const { addToCart } = useCart();

  // Mock data for the new fields
  const mockData = {
    rating: 4.5,
    views: "1.2k",
    downloads: 540,
  };

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        className="h-full"
        whileHover={{ y: -5, scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card className="h-full flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group p-0">
          <Link
            href={`/book/${book._id}`}
            className="block aspect-[2/3] relative overflow-hidden"
            aria-label={`View details for ${book.title}`}
          >
            <Image
              src={book.coverImage}
              alt={`Cover of ${book.title}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          <CardContent className="p-4 flex flex-col flex-grow">
            <div>
              <CardTitle className="text-lg font-semibold leading-tight mb-1">
                <Link
                  href={`/book/${book._id}`}
                  className="hover:text-primary transition-colors line-clamp-2 h-12"
                >
                  {book.title}
                </Link>
              </CardTitle>
              <p className="text-sm text-muted-foreground mb-2">
                {book.author}
              </p>
            </div>

            {/* --- NEW META DATA SECTION --- */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    {/* The star is filled for a better visual */}
                    <Star className="h-4 w-4 mr-1 fill-amber-400 text-amber-500" />
                    <span>{mockData.rating}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Average Rating</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{mockData.views}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total Views</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    <span>{mockData.downloads}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total Downloads</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {/* --- END OF NEW SECTION --- */}

            <div className="mt-auto pt-4 space-y-2">
              <p className="text-xl font-bold text-primary">
                Ksh. {book.price.toFixed(2)}
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => addToCart(book)}
                aria-label={`Add ${book.title} to cart`}
              >
                <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
