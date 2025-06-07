/**
 * @file This file defines the dynamic admin page for editing an existing book.
 * It fetches the book's current data and provides a form to update its details and files.
 */

"use client";

import { useEffect, useState, useRef, FormEvent, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import type { IBook } from "@/models/Book";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Ban, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

/**
 * A dynamic client page for editing a book. The specific book is determined by
 * the `id` parameter in the URL (e.g., `/admin/books/edit/[id]`).
 */
export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const [bookData, setBookData] = useState<Partial<IBook>>({});
  const [isLoading, setIsLoading] = useState(true); // Manages initial data fetching state.
  const [isSubmitting, setIsSubmitting] = useState(false); // Manages form submission state.
  const [error, setError] = useState<string | null>(null);

  // Refs for file inputs to access selected files.
  const coverFileRef = useRef<HTMLInputElement>(null);
  const bookFileRef = useRef<HTMLInputElement>(null);

  /**
   * Effect hook to fetch the existing book data from the API when the component mounts.
   */
  useEffect(() => {
    if (!bookId) return;

    const fetchBookData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/books/${bookId}`);
        if (!res.ok) {
          throw new Error("Book not found or failed to fetch data.");
        }
        const data: IBook = await res.json();
        setBookData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookData();
  }, [bookId]);

  /**
   * A generic handler to update the `bookData` state for text inputs and textareas.
   * @param {ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The change event.
   */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBookData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * A specific handler for the 'featured' checkbox.
   * @param {boolean} checked - The new checked state of the checkbox.
   */
  const handleCheckboxChange = (checked: boolean) => {
    setBookData((prev) => ({ ...prev, featured: checked }));
  };

  /**
   * Handles the form submission, including optional file uploads and updating the book data.
   * @param {FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const newCoverFile = coverFileRef.current?.files?.[0];
    const newBookFile = bookFileRef.current?.files?.[0];

    try {
      const uploadFile = async (file: File): Promise<string> => {
        const response = await fetch(
          `/api/upload?filename=${encodeURIComponent(file.name)}`,
          { method: "POST", body: file }
        );
        if (!response.ok) throw new Error(`Upload failed for ${file.name}`);
        return (await response.json()).url;
      };

      // Create a mutable copy of the book data to be sent to the API.
      const updatedData = { ...bookData };

      // If a new cover image is provided, upload it and update the `coverImage` URL.
      if (newCoverFile) {
        toast.info("Uploading new cover image...");
        updatedData.coverImage = await uploadFile(newCoverFile);
      }
      // If a new book file is provided, upload it and update the `fileUrl`.
      if (newBookFile) {
        toast.info("Uploading new book file...");
        updatedData.fileUrl = await uploadFile(newBookFile);
      }

      // Send the PATCH request with the updated data to the API.
      toast.loading("Saving changes...");
      const res = await fetch(`/api/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update book.");
      }

      toast.dismiss();
      toast.success("Book updated successfully!");
      router.push("/admin/books");
    } catch (err: any) {
      toast.dismiss();
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Displays a loader while fetching initial book data.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Displays an error message if the initial data fetch fails completely.
  if (error && !bookData.title) {
    return (
      <div className="py-6 space-y-4 text-center">
        <h1 className="text-3xl font-bold">Error</h1>
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could Not Load Book</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/admin/books">Back to Book List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold truncate">
            Edit Book: {bookData.title}
          </h1>
          <p className="text-muted-foreground">
            Modify the details of this book.
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-lg">
          <Link href="/admin/books">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Books
          </Link>
        </Button>
      </header>

      <Card className="rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
            <CardDescription>
              Update the book's information below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>An Error Occurred</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  name="title"
                  id="title"
                  value={bookData.title || ""}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  name="author"
                  id="author"
                  value={bookData.author || ""}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price (KES)</Label>
                <Input
                  name="price"
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={bookData.price || ""}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  name="category"
                  id="category"
                  value={bookData.category || ""}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                name="description"
                id="description"
                value={bookData.description || ""}
                onChange={handleInputChange}
                rows={3}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="synopsis">Full Synopsis</Label>
              <Textarea
                name="synopsis"
                id="synopsis"
                value={bookData.synopsis || ""}
                onChange={handleInputChange}
                rows={6}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <Label htmlFor="coverFile">Update Cover Image (Optional)</Label>
                <Input
                  id="coverFile"
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  disabled={isSubmitting}
                />
                {bookData.coverImage && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Current Cover:
                    </p>
                    <Image
                      src={bookData.coverImage}
                      alt="Current cover"
                      width={100}
                      height={150}
                      className="rounded-md object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookFile">Update Book File (Optional)</Label>
                <Input
                  id="bookFile"
                  ref={bookFileRef}
                  type="file"
                  accept=".pdf,.epub"
                  disabled={isSubmitting}
                />
                {bookData.fileUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Current File:
                    </p>
                    <Link
                      href={bookData.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all text-sm"
                    >
                      {bookData.fileUrl.split("/").pop()}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="featured"
                checked={bookData.featured || false}
                onCheckedChange={handleCheckboxChange}
                disabled={isSubmitting}
              />
              <Label htmlFor="featured" className="font-normal cursor-pointer">
                Mark as Featured Book
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4">
            <Button
              type="button"
              variant="ghost"
              asChild
              className="rounded-lg"
            >
              <Link href="/admin/books">
                <Ban className="mr-2 h-5 w-5" /> Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              className="rounded-lg shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
