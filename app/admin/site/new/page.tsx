/**
 * @file This file defines the admin page for adding a new site content block.
 * It provides a form for creating content with a unique key, title, and body.
 */

"use-client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Save, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * A client component that provides a form for administrators to create a new
 * piece of manageable site content.
 */
export default function AddNewContentPage() {
  const router = useRouter();
  /** State to hold the unique identifier for the new content block. */
  const [key, setKey] = useState("");
  /** State to hold the title of the new content. */
  const [title, setTitle] = useState("");
  /** State to hold the main body (Markdown) of the new content. */
  const [content, setContent] = useState("");
  /** State to manage the loading state during form submission. */
  const [isLoading, setIsLoading] = useState(false);
  /** State to hold any error messages from the API submission. */
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the form submission event. It constructs a payload and sends a PATCH
   * request to the API endpoint to create (or update) the content block.
   *
   * @param {FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // TODO: Implement client-side validation for the `key` to enforce a specific
    // format (e.g., camelCase, no spaces) and provide immediate user feedback.

    try {
      // Uses a PATCH request to the `/api/site-content/[key]` endpoint.
      // The `upsert: true` option on the server-side handles the creation of the new document.
      const res = await fetch(`/api/site-content/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create content.");
      }

      // On success, redirect the user back to the main content management page.
      // TODO: Centralize application routes like '/admin/content' into a shared constants file.
      router.push("/admin/content");
      // TODO: Show a success toast notification on the destination page for better user feedback.
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Add New Site Content</h1>
        <p className="text-muted-foreground">
          Define a new editable content block for your website.
        </p>
      </header>

      <Card className="rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
            <CardDescription>
              The 'key' must be a unique identifier (e.g., 'privacyPolicy') and
              cannot be changed later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display an error message if the form submission fails. */}
            {/* TODO: Replace this inline alert with a less intrusive toast notification. */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="key">Unique Key</Label>
              <Input
                id="key"
                placeholder="e.g., aboutPageContent"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter the title for this content"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown supported)</Label>
              <Textarea
                id="content"
                placeholder="Write the page content here..."
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild className="rounded-lg">
              <Link href="/admin/content">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Content
              </Link>
            </Button>
            <Button
              type="submit"
              className="rounded-lg shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Save Content
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
