"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { FileUpload } from "./file-upload"; // Reusing the same component

export function AddGenreForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!imageUrl) {
      setError("Please upload a genre image.");
      setIsSubmitting(false);
      return;
    }

    try {
      const genreData = { name, image: imageUrl };

      toast.loading("Saving new genre...");
      const res = await fetch("/api/genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genreData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create the genre.");
      }

      toast.dismiss();
      toast.success("Genre created successfully!");
      router.push("/admin/genres");
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

        <div className="space-y-2">
          <Label htmlFor="name">Genre Name</Label>
          <Input
            id="name"
            placeholder="e.g., Science Fiction"
            required
            disabled={isSubmitting}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <FileUpload
          label="Genre Image"
          uploadType="image"
          acceptedFileTypes="image/*"
          helpText="PNG, JPG, WEBP (max 10MB). Recommended aspect ratio 4:3."
          onUploadComplete={(result) => setImageUrl(result.url)}
          onRemove={() => setImageUrl(null)}
          disabled={isSubmitting}
        />
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        <Button
          type="submit"
          className="rounded-lg shadow-md"
          disabled={isSubmitting || !name || !imageUrl}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" /> Save Genre
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
