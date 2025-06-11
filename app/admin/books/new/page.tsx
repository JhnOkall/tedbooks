/**
 * @file This file defines the admin page for adding a new book to the catalog.
 * It provides a comprehensive form for all book details, including file uploads with previews.
 */

"use client";

import { useState, useRef, FormEvent, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  Upload,
  Image as ImageIcon,
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

/**
 * A client component that provides a form for administrators to create a new book,
 * including uploading the cover image and the book file itself.
 */
export default function AddNewBookPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload states for both files
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

  // Refs for hidden file inputs
  const coverFileRef = useRef<HTMLInputElement>(null);
  const bookFileRef = useRef<HTMLInputElement>(null);

  /**
   * Uploads a file with progress tracking and chunked upload for large files
   */
  const uploadFileWithProgress = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    // For large files (>10MB), we could implement chunked upload
    // For now, we'll use a simple upload with progress simulation
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const isLargeFile = file.size > 10 * 1024 * 1024; // 10MB threshold

    if (isLargeFile) {
      // Simulate progress for large files
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 10, 90);
        onProgress(progress);
      }, 200);

      try {
        const response = await fetch(
          `/api/upload?filename=${encodeURIComponent(file.name)}`,
          {
            method: "POST",
            body: file,
          }
        );

        clearInterval(progressInterval);
        onProgress(100);

        if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
        const newBlob = await response.json();
        return newBlob.url;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    } else {
      // For smaller files, upload normally
      onProgress(50);
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          body: file,
        }
      );
      onProgress(100);

      if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
      const newBlob = await response.json();
      return newBlob.url;
    }
  };

  /**
   * Handles cover image selection and immediate upload
   */
  const handleCoverImageSelect = useCallback(async (file: File) => {
    // Create preview
    const preview = URL.createObjectURL(file);

    setCoverUpload((prev) => ({
      ...prev,
      file,
      preview,
      isUploading: true,
      progress: 0,
    }));

    try {
      const uploadUrl = await uploadFileWithProgress(file, (progress) => {
        setCoverUpload((prev) => ({ ...prev, progress }));
      });

      setCoverUpload((prev) => ({
        ...prev,
        isUploading: false,
        isUploaded: true,
        uploadUrl,
      }));

      toast.success("Cover image uploaded successfully!");
    } catch (error: any) {
      setCoverUpload((prev) => ({
        ...prev,
        isUploading: false,
        isUploaded: false,
      }));
      toast.error(`Failed to upload cover image: ${error.message}`);
    }
  }, []);

  /**
   * Handles book file selection and immediate upload
   */
  const handleBookFileSelect = useCallback(async (file: File) => {
    // Create preview info
    const preview = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;

    setBookUpload((prev) => ({
      ...prev,
      file,
      preview,
      isUploading: true,
      progress: 0,
    }));

    try {
      const uploadUrl = await uploadFileWithProgress(file, (progress) => {
        setBookUpload((prev) => ({ ...prev, progress }));
      });

      setBookUpload((prev) => ({
        ...prev,
        isUploading: false,
        isUploaded: true,
        uploadUrl,
      }));

      toast.success("Book file uploaded successfully!");
    } catch (error: any) {
      setBookUpload((prev) => ({
        ...prev,
        isUploading: false,
        isUploaded: false,
      }));
      toast.error(`Failed to upload book file: ${error.message}`);
    }
  }, []);

  /**
   * Removes uploaded cover image
   */
  const removeCoverImage = () => {
    if (coverUpload.preview) {
      URL.revokeObjectURL(coverUpload.preview);
    }
    setCoverUpload({
      file: null,
      preview: null,
      isUploading: false,
      isUploaded: false,
      uploadUrl: null,
      progress: 0,
    });
    if (coverFileRef.current) {
      coverFileRef.current.value = "";
    }
  };

  /**
   * Removes uploaded book file
   */
  const removeBookFile = () => {
    setBookUpload({
      file: null,
      preview: null,
      isUploading: false,
      isUploaded: false,
      uploadUrl: null,
      progress: 0,
    });
    if (bookFileRef.current) {
      bookFileRef.current.value = "";
    }
  };

  /**
   * Handles the form submission
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      // Validate that files have been uploaded
      if (!coverUpload.isUploaded || !coverUpload.uploadUrl) {
        throw new Error("Please upload a cover image first.");
      }
      if (!bookUpload.isUploaded || !bookUpload.uploadUrl) {
        throw new Error("Please upload a book file first.");
      }

      // Prepare the book data payload
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

      // Send the book data to the server
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

            {/* Custom File Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Image Upload */}
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
                            <span className="text-sm">
                              Uploading... {coverUpload.progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${coverUpload.progress}%` }}
                            />
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
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverImageSelect(file);
                  }}
                  disabled={isSubmitting || coverUpload.isUploading}
                />
              </div>

              {/* Book File Upload */}
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
                        PDF, EPUB (max 100MB)
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
                            <span className="text-sm">
                              Uploading... {bookUpload.progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${bookUpload.progress}%` }}
                            />
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
                !bookUpload.isUploaded ||
                coverUpload.isUploading ||
                bookUpload.isUploading
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
