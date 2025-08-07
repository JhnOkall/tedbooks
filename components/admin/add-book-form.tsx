/**
 * @file Defines the client-side form for creating a new book.
 * It handles form state, submission, AI generation, and uses a dropdown
 * for genre selection populated from the database.
 */

"use client";

// --- MODIFICATION START: Added useEffect for data fetching ---
import { useState, FormEvent, ChangeEvent, useEffect } from "react";
// --- MODIFICATION END ---
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Save, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { FileUpload } from "./file-upload";

/**
 * A client component that provides the interactive form for adding a book.
 * It fetches available genres to display in a dropdown menu.
 */
export function AddBookForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- MODIFICATION START: State for genres dropdown ---
  const [genres, setGenres] = useState<IGenre[]>([]);
  const [isGenresLoading, setIsGenresLoading] = useState(true);
  // --- MODIFICATION END ---

  // --- MODIFICATION START: Updated formData state ---
  // 'featured' is removed, and 'genre' will now store the genre's ID.
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    price: "",
    genre: "", // Will hold the selected genre's _id
    description: "",
    synopsis: "",
  });
  // --- MODIFICATION END ---

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [bookFileUrl, setBookFileUrl] = useState<string | null>(null);
  const [filePublicId, setFilePublicId] = useState<string | null>(null);

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
      toast.error("Please enter a Title and Author first.");
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
      toast.success("Description and synopsis generated!");
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

    // --- MODIFICATION START: Updated validation checks ---
    if (!coverImageUrl) {
      setError("Please upload a cover image.");
      setIsSubmitting(false);
      return;
    }
    if (!bookFileUrl || !filePublicId) {
      setError("Please upload a book file.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.genre) {
      setError("Please select a genre.");
      setIsSubmitting(false);
      return;
    }
    // --- MODIFICATION END ---

    try {
      // The `formData` object is now correctly structured without 'featured'.
      const bookData = {
        ...formData,
        price: Number(formData.price),
        coverImage: coverImageUrl,
        fileUrl: bookFileUrl,
        filePublicId: filePublicId,
      };

      toast.loading("Saving book details...");
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const validationMessage = errorData.errors
          ? Object.values(errorData.errors)
              .map((e: any) => e.message)
              .join(" ")
          : errorData.message;
        throw new Error(validationMessage || "Failed to save the book.");
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

        {/* Title and Author fields are unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              name="title"
              id="title"
              placeholder="Enter book title"
              required
              disabled={isSubmitting || isGenerating}
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              name="author"
              id="author"
              placeholder="Enter author's name"
              required
              disabled={isSubmitting || isGenerating}
              value={formData.author}
              onChange={handleInputChange}
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
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Description & Synopsis with AI
              </>
            )}
          </Button>
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
              value={formData.price}
              onChange={handleInputChange}
            />
          </div>
          {/* --- MODIFICATION START: Replaced Input with Select for Genre --- */}
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
          {/* --- MODIFICATION END --- */}
        </div>

        {/* Description and Synopsis textareas are unchanged */}
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
            value={formData.description}
            onChange={handleInputChange}
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
            value={formData.synopsis}
            onChange={handleInputChange}
          />
        </div>

        {/* FileUpload components are unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            label="Cover Image"
            uploadType="image"
            acceptedFileTypes="image/*"
            helpText="PNG, JPG, WEBP (max 10MB)"
            onUploadComplete={(result) => setCoverImageUrl(result.url)}
            onRemove={() => setCoverImageUrl(null)}
            disabled={isSubmitting}
          />
          <FileUpload
            label="Book File"
            uploadType="file"
            acceptedFileTypes=".pdf,.epub"
            helpText="PDF, EPUB (max 10MB)"
            onUploadComplete={(result) => {
              setBookFileUrl(result.url);
              setFilePublicId(result.publicId);
            }}
            onRemove={() => {
              setBookFileUrl(null);
              setFilePublicId(null);
            }}
            disabled={isSubmitting}
          />
        </div>

        {/* --- MODIFICATION: Removed the "Featured" checkbox --- */}
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        {/* --- MODIFICATION: Updated disabled check --- */}
        <Button
          type="submit"
          className="rounded-lg shadow-md"
          disabled={
            isSubmitting ||
            isGenerating ||
            !formData.genre || // <-- Check if a genre is selected
            !coverImageUrl ||
            !bookFileUrl ||
            !filePublicId
          }
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
