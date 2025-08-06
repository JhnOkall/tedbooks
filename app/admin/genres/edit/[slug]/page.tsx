import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { IGenre } from "@/models/Genre";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditGenreForm } from "@/components/admin/edit-genre-form";

async function getGenre(slug: string): Promise<IGenre | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/genres/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Failed to fetch genre:", error);
    return null;
  }
}

export default async function EditGenrePage({
  params,
}: {
  params: { slug: string };
}) {
  const genre = await getGenre(params.slug);

  if (!genre) {
    notFound();
  }

  return (
    <div className="py-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold truncate">
            Edit Genre: {genre.name}
          </h1>
          <p className="text-muted-foreground">
            Modify the details of this genre.
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-lg">
          <Link href="/admin/genres">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Genres
          </Link>
        </Button>
      </header>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle>Genre Details</CardTitle>
          <CardDescription>
            Update the information below. The slug will update automatically if
            the name changes.
          </CardDescription>
        </CardHeader>
        <EditGenreForm genre={genre} />
      </Card>
    </div>
  );
}
