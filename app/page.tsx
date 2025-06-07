/**
 * @file This file defines the main homepage component for the application.
 * It serves as the primary landing page, featuring a hero section to welcome users
 * and a section to display featured books.
 */

import { MainLayout } from "@/components/layout/MainLayout";
import { FeaturedBooks } from "@/components/books/FeaturedBooks";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { JSX } from "react";

/**
 * The main homepage component for the application.
 * As a React Server Component, it renders static content and includes other server
 * components like `FeaturedBooks` to fetch data server-side.
 *
 * @returns {JSX.Element} The rendered homepage.
 */
export default function HomePage(): JSX.Element {
  return (
    <MainLayout>
      {/* Hero Section: The main introductory block for the homepage. */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/20 via-background to-accent/20 text-center overflow-hidden">
        {/* TODO: The text content in this hero section is hardcoded. For better marketing flexibility,
        this content could be fetched from a headless CMS or a site configuration file. */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Discover Your Next Favourite Book
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10">
            Explore our curated collection of bestsellers, hidden gems, and
            timeless classics. Your literary adventure starts here.
          </p>
          <div className="mb-12">
            <SearchInput />
          </div>
          <Button
            asChild
            size="lg"
            className="rounded-lg px-8 py-3 text-lg shadow-lg"
          >
            {/* TODO: Centralize application routes like '/shop' into a shared constants file
            to improve maintainability and prevent magic strings. */}
            <Link href="/shop">Explore All Books</Link>
          </Button>
        </div>
      </section>

      {/* Featured Books Section: Displays a curated list of books. */}
      {/* This is a server component that handles its own data fetching. */}
      <FeaturedBooks />
    </MainLayout>
  );
}
