/**
 * @file This file defines the admin page for managing book genres.
 * It provides a table view of all genres with actions to add, edit, or delete them.
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { IGenre } from "@/models/Genre"; // <-- Use IGenre type
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * The main component for the "Manage Genres" admin page.
 */
export default function ManageGenresPage() {
  const [genres, setGenres] = useState<IGenre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genreToDelete, setGenreToDelete] = useState<IGenre | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchGenres = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/genres");
        if (!res.ok) {
          throw new Error("Failed to fetch genres.");
        }
        const data = await res.json();
        setGenres(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGenres();
  }, []);

  const handleDeleteGenre = async () => {
    if (!genreToDelete) return;
    setIsDeleting(true);

    try {
      // Use the genre's slug for the API call
      const res = await fetch(`/api/genres/${genreToDelete.slug}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) {
        // Display the specific error message from the API (e.g., "Cannot delete genre...")
        throw new Error(result.message || "Failed to delete the genre.");
      }

      setGenres((prevGenres) =>
        prevGenres.filter((genre) => genre._id !== genreToDelete._id)
      );
      toast.success(`'${genreToDelete.name}' has been deleted.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenreToDelete(null);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Fetching Genres</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="py-6 space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Genres</h1>
            <p className="text-muted-foreground">
              Add, edit, or remove genres from your store.
            </p>
          </div>
          <Button asChild className="rounded-lg shadow-md">
            <Link href="/admin/genres/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Genre
            </Link>
          </Button>
        </header>

        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle>Genre List</CardTitle>
            <CardDescription>
              A list of all genres in your store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {genres.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No genres found. Add one to get started!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] sm:w-[100px]">
                        Image
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Slug
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {genres.map((genre) => (
                      <TableRow key={genre._id.toString()}>
                        <TableCell>
                          <Image
                            src={genre.image}
                            alt={genre.name}
                            width={80}
                            height={60}
                            className="rounded object-cover aspect-[4/3]"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {genre.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {genre.slug}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button asChild variant="outline" size="icon">
                              {/* Link to the edit page using the genre's slug */}
                              <Link href={`/admin/genres/edit/${genre.slug}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setGenreToDelete(genre)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!genreToDelete}
        onOpenChange={() => setGenreToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              genre
              <span className="font-bold"> "{genreToDelete?.name}"</span>. This
              will fail if any books are currently assigned to this genre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGenre}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
