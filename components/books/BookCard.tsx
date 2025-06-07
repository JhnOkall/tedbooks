"use client";

import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const { addToCart } = useCart();

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="h-full flex flex-col overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="p-0">
          <Link
            href={`/book/${book._id}`}
            className="block aspect-[2/3] relative overflow-hidden"
          >
            <Image
              src={book.coverImage}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={"book cover"}
            />
          </Link>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-headline leading-tight mb-1">
            <Link
              href={`/book/${book._id}`}
              className="hover:text-primary transition-colors"
            >
              {book.title}
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
          <p className="text-xs text-foreground/80 line-clamp-3">
            {book.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center">
          <p className="text-xl font-semibold text-primary">
            Ksh. {book.price.toFixed(2)}
          </p>
          <Button
            size="sm"
            onClick={() => addToCart(book)}
            aria-label={`Add ${book.title} to cart`}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> Add
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
