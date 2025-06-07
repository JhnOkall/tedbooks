import { MainLayout } from "@/components/layout/MainLayout";
import { FeaturedBooks } from "@/components/books/FeaturedBooks";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <MainLayout>
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/20 via-background to-accent/20 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          {/* Optional: subtle background pattern or image */}
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold mb-6">
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
            className="rounded-xl px-8 py-3 text-lg shadow-lg"
          >
            <Link href="/shop">Explore All Books</Link>
          </Button>
        </div>
      </section>
      <FeaturedBooks />
    </MainLayout>
  );
}
