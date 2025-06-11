/**
 * @file Defines the client-side form for creating a new book.
 * It handles form state, submission, and uses the reusable FileUpload component.
 */

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { FileUpload } from "./file-upload"; // Import our new component

/**
 * A client component that provides the interactive form for adding a book.
 */
export function AddBookForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State now only needs to hold the final URLs
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [bookFileUrl, setBookFileUrl] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate that files have been uploaded
    if (!coverImageUrl) {
      setError("Please upload a cover image first.");
      setIsSubmitting(false);
      return;
    }
    if (!bookFileUrl) {
      setError("Please upload a book file first.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    try {
      const bookData = {
        title: formData.get("title"),
        author: formData.get("author"),
        price: Number(formData.get("price")),
        category: formData.get("category"),
        description: formData.get("description"),
        synopsis: formData.get("synopsis"),
        featured: formData.get("featured") === "on",
        coverImage: coverImageUrl,
        fileUrl: bookFileUrl,
      };

      toast.loading("Saving book details...");
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save the book.");
      }

      toast.dismiss();
      toast.success("Book created successfully!");
      router.push("/admin/books");
    } catch (err: any) {
      toast.dismiss();
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
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
              placeholder="Enter book title"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              name="author"
              id="author"
              placeholder="Enter author's name"
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
              placeholder="e.g., 1200.00"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              name="category"
              id="category"
              placeholder="e.g., Fiction, Sci-Fi"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">
            Short Description (for card views)
          </Label>
          <Textarea
            name="description"
            id="description"
            placeholder="A brief summary (1-2 sentences)"
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
            placeholder="Detailed synopsis of the book"
            rows={6}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Reusable File Upload Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            label="Cover Image"
            uploadType="image"
            acceptedFileTypes="image/*"
            helpText="PNG, JPG, WEBP (max 10MB)"
            onUploadComplete={(url) => setCoverImageUrl(url)}
            onRemove={() => setCoverImageUrl(null)}
            disabled={isSubmitting}
          />
          <FileUpload
            label="Book File"
            uploadType="file"
            acceptedFileTypes=".pdf,.epub"
            helpText="PDF, EPUB (max 10MB)"
            onUploadComplete={(url) => setBookFileUrl(url)}
            onRemove={() => setBookFileUrl(null)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox name="featured" id="featured" disabled={isSubmitting} />
          <Label htmlFor="featured" className="font-normal cursor-pointer">
            Mark as Featured Book
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        <Button
          type="submit"
          className="rounded-lg shadow-md"
          disabled={isSubmitting || !coverImageUrl || !bookFileUrl}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" /> Save Book
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
