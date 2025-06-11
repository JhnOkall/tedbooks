/**
 * @file This file defines the admin page for adding a new book to the catalog.
 * It provides a comprehensive form for all book details, including file uploads with previews.
 * This component uses the recommended client-side direct upload pattern for Vercel Blob.
 */

"use client";

import { useState, useRef, FormEvent, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client"; // Import the client-side upload function

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
import {
  Save,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ImageIcon,
  FileText,
  X,
  CheckCircle,
} from "lucide-react";

interface UploadState {
  file: File | null;
  preview: string | null;
  isUploading: boolean;
  isUploaded: boolean;
  uploadUrl: string | null;
  progress: number;
}

export default function AddNewBookPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [coverUpload, setCoverUpload] = useState<UploadState>({
    file: null,
    preview: null,
    isUploading: false,
    isUploaded: false,
    uploadUrl: null,
    progress: 0,
  });

  const [bookUpload, setBookUpload] = useState<UploadState>({
    file: null,
    preview: null,
    isUploading: false,
    isUploaded: false,
    uploadUrl: null,
    progress: 0,
  });

  const coverFileRef = useRef<HTMLInputElement>(null);
  const bookFileRef = useRef<HTMLInputElement>(null);

  /**
   * Uploads a file directly from the client to Vercel Blob.
   * @param file The file to upload.
   * @param uploadType The type of upload ('cover' or 'book').
   * @returns The PutBlobResult containing the final URL.
   */
  const uploadFile = async (file: File, uploadType: "cover" | "book") => {
    // The API endpoint we created in Step 1.
    // We pass uploadType to it so it can set the correct folder path.
    const uploadApiUrl = `/api/upload?uploadType=${uploadType}`;

    // The `upload` function from `@vercel/blob/client` handles the entire process.
    const newBlob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: uploadApiUrl,
    });

    return newBlob;
  };

  const handleCoverImageSelect = useCallback(async (file: File) => {
    const preview = URL.createObjectURL(file);
    setCoverUpload({
      file,
      preview,
      isUploading: true,
      isUploaded: false,
      uploadUrl: null,
      progress: 50, // Simulate progress as direct upload has no native progress events yet
    });

    try {
      const newBlob = await uploadFile(file, "cover");
      setCoverUpload((prev) => ({
        ...prev,
        isUploading: false,
        isUploaded: true,
        uploadUrl: newBlob.url,
        progress: 100,
      }));
      toast.success("Cover image uploaded successfully!");
    } catch (error: any) {
      setCoverUpload((prev) => ({ ...prev, isUploading: false, progress: 0 }));
      toast.error(`Cover upload failed: ${error.message}`);
    }
  }, []);

  const handleBookFileSelect = useCallback(async (file: File) => {
    const preview = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    setBookUpload({
      file,
      preview,
      isUploading: true,
      isUploaded: false,
      uploadUrl: null,
      progress: 50, // Simulate progress
    });

    try {
      const newBlob = await uploadFile(file, "book");
      setBookUpload((prev) => ({
        ...prev,
        isUploading: false,
        isUploaded: true,
        uploadUrl: newBlob.url,
        progress: 100,
      }));
      toast.success("Book file uploaded successfully!");
    } catch (error: any) {
      setBookUpload((prev) => ({ ...prev, isUploading: false, progress: 0 }));
      toast.error(`Book file upload failed: ${error.message}`);
    }
  }, []);

  // The rest of your component (removeCoverImage, removeBookFile, handleSubmit, and the JSX)
  // remains EXACTLY THE SAME as it was already designed to handle the post-upload state correctly.
  // ... (paste the rest of your original component code from removeCoverImage downwards here)

  const removeCoverImage = () => {
    if (coverUpload.preview) URL.revokeObjectURL(coverUpload.preview);
    setCoverUpload({
      file: null,
      preview: null,
      isUploading: false,
      isUploaded: false,
      uploadUrl: null,
      progress: 0,
    });
    if (coverFileRef.current) coverFileRef.current.value = "";
  };

  const removeBookFile = () => {
    setBookUpload({
      file: null,
      preview: null,
      isUploading: false,
      isUploaded: false,
      uploadUrl: null,
      progress: 0,
    });
    if (bookFileRef.current) bookFileRef.current.value = "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    try {
      if (!coverUpload.isUploaded || !coverUpload.uploadUrl)
        throw new Error("Please upload a cover image first.");
      if (!bookUpload.isUploaded || !bookUpload.uploadUrl)
        throw new Error("Please upload a book file first.");
      const bookData = {
        title: formData.get("title"),
        author: formData.get("author"),
        price: Number(formData.get("price")),
        category: formData.get("category"),
        description: formData.get("description"),
        synopsis: formData.get("synopsis"),
        featured: formData.get("featured") === "on",
        coverImage: coverUpload.uploadUrl,
        fileUrl: bookUpload.uploadUrl,
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
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NOTE: The entire JSX from your original component can be pasted here. It does not need any changes.
  return (
    <div className="py-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Add New Book</h1>
          <p className="text-muted-foreground">
            Fill in the details to add a new book to your catalog.
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
              Enter information for the new book. Files will upload
              automatically when selected.
            </CardDescription>
          </CardHeader>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-gray-400">
                  {!coverUpload.file ? (
                    <div
                      className="flex flex-col items-center justify-center py-8 cursor-pointer"
                      onClick={() => coverFileRef.current?.click()}
                    >
                      <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload cover image
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, WEBP (max 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {coverUpload.preview && (
                        <div className="relative">
                          <img
                            src={coverUpload.preview}
                            alt="Cover preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={removeCoverImage}
                            disabled={coverUpload.isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {coverUpload.isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Uploading...</span>
                          </div>
                        </div>
                      )}
                      {coverUpload.isUploaded && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">
                            Cover image uploaded successfully
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverImageSelect(file);
                  }}
                  disabled={isSubmitting || coverUpload.isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label>Book File (PDF, EPUB)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-gray-400">
                  {!bookUpload.file ? (
                    <div
                      className="flex flex-col items-center justify-center py-8 cursor-pointer"
                      onClick={() => bookFileRef.current?.click()}
                    >
                      <FileText className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload book file
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, EPUB (max 50MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-medium truncate">
                            {bookUpload.preview}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeBookFile}
                          disabled={bookUpload.isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {bookUpload.isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Uploading...</span>
                          </div>
                        </div>
                      )}
                      {bookUpload.isUploaded && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">
                            Book file uploaded successfully
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={bookFileRef}
                  type="file"
                  accept=".pdf,.epub"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBookFileSelect(file);
                  }}
                  disabled={isSubmitting || bookUpload.isUploading}
                />
              </div>
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
              disabled={
                isSubmitting ||
                !coverUpload.isUploaded ||
                !bookUpload.isUploaded
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
      </Card>
    </div>
  );
}
