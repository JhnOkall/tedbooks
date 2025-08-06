/**
 * @file Defines the BrowseGenres component, a server-side component responsible for
 * fetching and displaying a grid of all available book genres.
 */

import { getAllGenres } from "@/lib/data";
import { GenreCard } from "@/components/genres/GenreCard";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { JSX } from "react";

/**
 * A React Server Component that fetches and displays a grid of book genres.
 * It directly fetches data on the server, making it efficient and SEO-friendly.
 * It includes a fallback UI for when no genres are available.
 *
 * @returns {Promise<JSX.Element>} A promise that resolves to the rendered component.
 */
export async function BrowseGenres(): Promise<JSX.Element> {
  // Fetches the list of all genres directly on the server.
  const genres = await getAllGenres();

  // Handle the case where no genres are available.
  if (!genres || genres.length === 0) {
    return (
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Browse By Genre
          </h2>
          <Alert variant="default" className="max-w-xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Genres Available</AlertTitle>
            <AlertDescription>
              We're organizing our library. Please check back later!
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Browse By Genre</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {genres.map((genre) => (
            <div key={genre._id} className="aspect-[4/3]">
              <GenreCard genre={genre} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
