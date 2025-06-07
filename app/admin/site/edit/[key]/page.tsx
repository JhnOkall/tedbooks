/**
 * @file This file defines the dynamic admin page for editing a specific site content block.
 * It fetches existing content based on a URL parameter and provides a form to update it.
 */

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
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
import {
  Save,
  Ban,
  Loader2,
  AlertCircle,
  Terminal,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Type definition for the content data being edited.
 */
interface ContentData {
  title: string;
  content: string;
}

/**
 * A dynamic client page for editing a site content block. The specific content
 * to edit is determined by the `key` parameter in the URL (e.g., `/admin/content/edit/aboutPageContent`).
 */
export default function EditContentPage() {
  const params = useParams();
  const key = params.key as string; // The unique key from the URL path.

  const [contentData, setContentData] = useState<Partial<ContentData>>({});
  const [isLoading, setIsLoading] = useState(true); // Manages the initial data fetching state.
  const [isSaving, setIsSaving] = useState(false); // Manages the state during form submission.
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect hook to fetch the content data from the API when the component mounts
   * or when the `key` parameter changes.
   */
  useEffect(() => {
    if (!key) return;

    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/site-content/${key}`);
        if (res.ok) {
          const data = await res.json();
          setContentData(data);
        } else if (res.status === 404) {
          // If content is not found, treat this as a creation form for that key.
          setContentData({ title: "", content: "" });
          setError(
            `Content with key '${key}' not found. You can create it by saving changes.`
          );
        } else {
          throw new Error("Failed to load content.");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching content.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [key]);

  /**
   * Handles the form submission to save the updated content.
   * @param {FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/site-content/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save content.");
      }
      toast.success("Content saved successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Displays a loader while the initial content is being fetched.
  if (isLoading) {
    // TODO: For a better UX, replace this generic loader with a skeleton loader
    // that mimics the form's layout.
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">
          Edit Content: <code>{key}</code>
        </h1>
        <p className="text-muted-foreground">
          Modify the details for this content block.
        </p>
      </header>

      <Card className="rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
            <CardDescription>
              Update the information below. Markdown is supported for the
              content field.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* TODO: Replace these inline error/success alerts with non-blocking toast notifications. */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={contentData.title || ""}
                onChange={(e) =>
                  setContentData({ ...contentData, title: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown supported)</Label>
              <Textarea
                id="content"
                value={contentData.content || ""}
                onChange={(e) =>
                  setContentData({ ...contentData, content: e.target.value })
                }
                rows={15}
                disabled={isSaving}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              asChild
              className="rounded-lg"
            >
              <Link href="/admin/content">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Link>
            </Button>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="ghost"
                asChild
                className="rounded-lg"
              >
                <Link href="/admin/content">
                  <Ban className="mr-2 h-5 w-5" /> Cancel
                </Link>
              </Button>
              <Button
                type="submit"
                className="rounded-lg shadow-md"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
