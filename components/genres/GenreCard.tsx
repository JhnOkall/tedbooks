/**
 * @file Defines the GenreCard component, a client-side component for displaying
 * a single genre with a link to a filtered shop page.
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { Genre } from "@/types";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { JSX } from "react";

/**
 * Defines the props for the GenreCard component.
 */
interface GenreCardProps {
  /**
   * The genre object containing data to display.
   */
  genre: Genre;
}

/**
 * A reusable UI component that renders a genre's details in a card.
 * Clicking the card navigates to the shop page with a filter applied for that genre.
 *
 * @param {GenreCardProps} props - The component's props.
 * @returns {JSX.Element} The rendered GenreCard component.
 */
export function GenreCard({ genre }: GenreCardProps): JSX.Element {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Link
        href={`/shop?genre=${genre.slug}`}
        aria-label={`Browse books in the ${genre.name} genre`}
        className="block h-full"
      >
        <Card className="overflow-hidden relative group h-full shadow-md hover:shadow-xl transition-shadow duration-300">
          {/* Background Image */}
          <Image
            src={genre.image}
            alt={`Promotional image for the ${genre.name} genre`}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50 transition-colors duration-300 group-hover:bg-black/60" />

          {/* Centered Genre Name */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <h3 className="text-2xl font-bold text-white text-center tracking-wide drop-shadow-md">
              {genre.name}
            </h3>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
