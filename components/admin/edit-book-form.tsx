/**
 * @file Defines the client-side form for editing an existing book.
 * It handles form state, submission, AI generation, and uses a
 * pre-populated dropdown for genre selection.
 */

"use client";

// --- MODIFICATION START: Added useEffect for data fetching ---
import { useState, FormEvent, ChangeEvent, useEffect } from "react";
// --- MODIFICATION END ---
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { IBook } from "@/models/Book";
import type { IGenre } from "@/models/Genre"; // <-- Import the Genre type

import { CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// --- MODIFICATION START: Import Select components ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// --- MODIFICATION END ---
import { Save, Ban, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { FileUpload } from "./file-upload";

interface EditBookFormProps {
  book: IBook;
}

/**
 * A client component that provides the interactive form for editing a book.
 * It fetches available genres to display in a dropdown menu.
 */
export function EditBookForm({ book }: EditBookFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- MODIFICATION START: State for genres dropdown ---
  const [genres, setGenres] = useState<IGenre[]>([]);
  const [isGenresLoading, setIsGenresLoading] = useState(true);
  // --- MODIFICATION END ---

  // --- MODIFICATION START: Updated formData state ---
  // We initialize the form data from the `book` prop.
  // The `featured` field is removed.
  // `genre` is initialized with the ID of the book's current genre object.
  const [formData, setFormData] = useState({
    ...book,
    // The book prop has a populated genre object. We need its ID for the Select value.
    genre: (book.genre as IGenre)?._id?.toString() || "",
  });
  // --- MODIFICATION END ---

  // --- MODIFICATION START: Fetch genres on component mount ---
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setIsGenresLoading(true);
        const res = await fetch("/api/genres");
        if (!res.ok) {
          throw new Error("Could not fetch genres.");
        }
        const data = await res.json();
        setGenres(data);
      } catch (err) {
        toast.error("Failed to load genres for selection.");
        console.error(err);
      } finally {
        setIsGenresLoading(false);
      }
    };

    fetchGenres();
  }, []);
  // --- MODIFICATION END ---

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- MODIFICATION START: New handler for the Select component ---
  const handleGenreChange = (value: string) => {
    setFormData((prev) => ({ ...prev, genre: value }));
  };
  // --- MODIFICATION END ---

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.author) {
      toast.error("Title and Author must be present to generate content.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    toast.loading("Generating with AI...");

    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "AI generation failed.");
      }

      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        description: data.description || "",
        synopsis: data.synopsis || "",
      }));

      toast.dismiss();
      toast.success("Description and synopsis regenerated!");
    } catch (err: any) {
      toast.dismiss();
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Create a new object for submission, excluding the 'featured' property
    const { featured, ...submissionData } = formData;

    try {
      toast.loading("Saving changes...");
      const res = await fetch(`/api/books/${book._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update book.");
      }

      toast.dismiss();
      toast.success("Book updated successfully!");
      router.push("/admin/books");
      router.refresh();
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
            <AlertTitle>An Error Occurred</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Title and Author fields are unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              name="title"
              id="title"
              value={formData.title || ""}
              onChange={handleInputChange}
              required
              disabled={isSubmitting || isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              name="author"
              id="author"
              value={formData.author || ""}
              onChange={handleInputChange}
              required
              disabled={isSubmitting || isGenerating}
            />
          </div>
        </div>

        {/* AI Generation button is unchanged */}
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateDescription}
            disabled={
              !formData.title ||
              !formData.author ||
              isGenerating ||
              isSubmitting
            }
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Regenerate with AI
              </>
            )}
          </Button>
        </div>

        {/* --- MODIFICATION START: Added Genre Select dropdown and Price input --- */}
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
              value={formData.price}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Select
              name="genre"
              value={formData.genre}
              onValueChange={handleGenreChange}
              required
              disabled={isSubmitting || isGenresLoading}
            >
              <SelectTrigger id="genre">
                <SelectValue placeholder="Select a genre..." />
              </SelectTrigger>
              <SelectContent>
                {isGenresLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading genres...
                  </SelectItem>
                ) : (
                  genres.map((genre) => (
                    <SelectItem
                      key={genre._id.toString()}
                      value={genre._id.toString()}
                    >
                      {genre.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* --- MODIFICATION END --- */}

        {/* Description and Synopsis textareas are unchanged */}
        <div className="space-y-2">
          <Label htmlFor="description">Short Description</Label>
          <Textarea
            name="description"
            id="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            rows={3}
            required
            disabled={isSubmitting || isGenerating}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="synopsis">Full Synopsis</Label>
          <Textarea
            name="synopsis"
            id="synopsis"
            value={formData.synopsis || ""}
            onChange={handleInputChange}
            rows={6}
            required
            disabled={isSubmitting || isGenerating}
            placeholder="Detailed synopsis of the book"
          />
        </div>

        {/* FileUpload components are unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            label="Cover Image"
            uploadType="image"
            acceptedFileTypes="image/*"
            helpText="Upload a new file to replace the current one."
            initialUrl={formData.coverImage}
            onUploadComplete={(result) =>
              setFormData((prev) => ({ ...prev, coverImage: result.url }))
            }
            onRemove={() =>
              setFormData((prev) => ({ ...prev, coverImage: book.coverImage }))
            }
            disabled={isSubmitting || isGenerating}
          />
          <FileUpload
            label="Book File"
            uploadType="file"
            acceptedFileTypes=".pdf,.epub"
            helpText="Upload a new file to replace the current one."
            initialUrl={formData.fileUrl}
            initialFileName={book.filePublicId}
            onUploadComplete={(result) =>
              setFormData((prev) => ({
                ...prev,
                fileUrl: result.url,
                filePublicId: result.publicId,
              }))
            }
            onRemove={() =>
              setFormData((prev) => ({
                ...prev,
                fileUrl: book.fileUrl,
                filePublicId: book.filePublicId,
              }))
            }
            disabled={isSubmitting || isGenerating}
          />
        </div>

        {/* --- MODIFICATION: Removed the "Featured" checkbox --- */}
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <Button type="button" variant="ghost" asChild className="rounded-lg">
          <Link href="/admin/books">
            <Ban className="mr-2 h-5 w-5" /> Cancel
          </Link>
        </Button>
        <Button
          type="submit"
          className="rounded-lg shadow-md"
          disabled={isSubmitting || isGenerating}
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
  );
}
