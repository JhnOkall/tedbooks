/**
 * @file Defines the client-side form for editing an existing book.
 * It handles form state, submission, AI generation, and uses the reusable FileUpload component.
 */

"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { IBook } from "@/models/Book";

import { CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
// === MODIFICATION: Added Sparkles icon ===
import { Save, Ban, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { FileUpload } from "./file-upload";

interface EditBookFormProps {
  book: IBook;
}

/**
 * A client component that provides the interactive form for editing a book.
 */
export function EditBookForm({ book }: EditBookFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<IBook>>(book);

  // === NEW: State for AI generation ===
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // === NEW: Handler for AI generation ===
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

      // Update form state with the generated content
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

    try {
      toast.loading("Saving changes...");
      const res = await fetch(`/api/books/${book._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              name="title"
              id="title"
              value={formData.title || ""}
              onChange={handleInputChange}
              required
              disabled={isSubmitting || isGenerating} // === MODIFICATION ===
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
              disabled={isSubmitting || isGenerating} // === MODIFICATION ===
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

        <div className="space-y-2">
          <Label htmlFor="description">Short Description</Label>
          <Textarea
            name="description"
            id="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            rows={3}
            required
            disabled={isSubmitting || isGenerating} // === MODIFICATION ===
          />
        </div>

        {/* === NEW: Synopsis Field === */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            label="Cover Image"
            uploadType="image"
            acceptedFileTypes="image/*"
            helpText="Upload a new file to replace the current one."
            initialUrl={formData.coverImage}
            onUploadComplete={(url) =>
              setFormData((prev) => ({ ...prev, coverImage: url }))
            }
            onRemove={() =>
              setFormData((prev) => ({ ...prev, coverImage: book.coverImage }))
            }
            disabled={isSubmitting || isGenerating} // === MODIFICATION ===
          />
          <FileUpload
            label="Book File"
            uploadType="file"
            acceptedFileTypes=".pdf,.epub"
            helpText="Upload a new file to replace the current one."
            initialUrl={formData.fileUrl}
            initialFileName={formData.fileUrl?.split("/").pop()}
            onUploadComplete={(url) =>
              setFormData((prev) => ({ ...prev, fileUrl: url }))
            }
            onRemove={() =>
              setFormData((prev) => ({ ...prev, fileUrl: book.fileUrl }))
            }
            disabled={isSubmitting || isGenerating} // === MODIFICATION ===
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="featured"
            checked={formData.featured || false}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, featured: !!checked }))
            }
            disabled={isSubmitting || isGenerating} // === MODIFICATION ===
          />
          <Label htmlFor="featured" className="font-normal cursor-pointer">
            Mark as Featured Book
          </Label>
        </div>
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
          disabled={isSubmitting || isGenerating} // === MODIFICATION ===
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
