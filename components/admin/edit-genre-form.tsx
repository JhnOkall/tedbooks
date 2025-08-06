"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { IGenre } from "@/models/Genre";

import { CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Ban, Loader2, AlertCircle } from "lucide-react";
import { FileUpload } from "./file-upload";

interface EditGenreFormProps {
  genre: IGenre;
}

export function EditGenreForm({ genre }: EditGenreFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: genre.name,
    image: genre.image,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      toast.loading("Saving changes...");
      // Use the original slug from props for the API endpoint
      const res = await fetch(`/api/genres/${genre.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update genre.");
      }

      toast.dismiss();
      toast.success("Genre updated successfully!");
      router.push("/admin/genres");
      router.refresh(); // Refresh server components
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

        <div className="space-y-2">
          <Label htmlFor="name">Genre Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            disabled={isSubmitting}
          />
        </div>

        <FileUpload
          label="Genre Image"
          uploadType="image"
          acceptedFileTypes="image/*"
          helpText="Upload a new file to replace the current one."
          initialUrl={formData.image}
          onUploadComplete={(result) =>
            setFormData((prev) => ({ ...prev, image: result.url }))
          }
          onRemove={() =>
            setFormData((prev) => ({ ...prev, image: genre.image }))
          }
          disabled={isSubmitting}
        />
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <Button type="button" variant="ghost" asChild className="rounded-lg">
          <Link href="/admin/genres">
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
  );
}
