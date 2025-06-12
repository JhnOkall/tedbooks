/**
 * @file Defines the client-side form for creating a new book.
 * It handles form state, submission, AI generation, and uses the reusable FileUpload component.
 */

"use client";

import { useState, FormEvent, ChangeEvent } from "react"; // === MODIFICATION ===
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, AlertCircle, Sparkles } from "lucide-react"; // === MODIFICATION ===
import { FileUpload } from "./file-upload";

/**
 * A client component that provides the interactive form for adding a book.
 */
export function AddBookForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === MODIFICATION: State for AI generation ===
  const [isGenerating, setIsGenerating] = useState(false);

  // === MODIFICATION: State for controlled form inputs ===
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    price: "",
    category: "",
    description: "",
    synopsis: "",
    featured: false,
  });

  // State now only needs to hold the final URLs
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [bookFileUrl, setBookFileUrl] = useState<string | null>(null);

  // === MODIFICATION: Handler for controlled inputs ===
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // === NEW FUNCTION: Handler for AI generation ===
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

      // Update form state with the generated content
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

    try {
      // === MODIFICATION: Use formData state instead of FormData API ===
      const bookData = {
        ...formData,
        price: Number(formData.price),
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
              onChange={handleInputChange} // === MODIFICATION ===
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
              onChange={handleInputChange} // === MODIFICATION ===
            />
          </div>
        </div>

        {/* === NEW: AI Generation Button === */}
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
              onChange={handleInputChange} // === MODIFICATION ===
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
              value={formData.category}
              onChange={handleInputChange} // === MODIFICATION ===
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
            value={formData.description}
            onChange={handleInputChange} // === MODIFICATION ===
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
            onChange={handleInputChange} // === MODIFICATION ===
          />
        </div>

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
          <Checkbox
            name="featured"
            id="featured"
            disabled={isSubmitting}
            checked={formData.featured} // === MODIFICATION ===
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, featured: Boolean(checked) }))
            } // === MODIFICATION ===
          />
          <Label htmlFor="featured" className="font-normal cursor-pointer">
            Mark as Featured Book
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        <Button
          type="submit"
          className="rounded-lg shadow-md"
          disabled={
            isSubmitting || isGenerating || !coverImageUrl || !bookFileUrl
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
