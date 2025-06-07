/**
 * @file This file defines the admin page for managing site content. It allows administrators
 * to select and edit content blocks (like the "About Us" page) that are stored in the database.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Loader2, Save, ArrowLeft, Terminal, AlertCircle } from "lucide-react";

/**
 * Defines the configuration for content pieces that are editable by the admin.
 * This array can be expanded to include more manageable content blocks in the future.
 */
const contentKeys = [
  { key: "aboutPageContent", label: "About Us Page" },
  // TODO: Add other manageable content pages here as the application grows.
  // Example: { key: 'faqPageContent', label: 'FAQ Page' }
  // Example: { key: 'termsAndConditions', label: 'Terms & Conditions' }
];

/**
 * Type definition for a single content item.
 */
type ContentItem = {
  key: string;
  title: string;
  content: string;
};

/**
_  * The main component for the "Manage Site Content" page. It functions as a mini-CMS,
 * allowing admins to switch between a list of editable content and a dedicated editor view.
 */
export default function ManageSiteContentPage() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<Partial<ContentItem>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  // TODO: Refactor state management. The `error` and `success` states are currently managed
  // with `useState` and displayed via `<Alert>`. Using a toast notification library (like the
  // already-installed `sonner`) would provide a more consistent and less intrusive user experience.
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Finds the user-friendly label for the currently selected content key.
  const selectedLabel = contentKeys.find((c) => c.key === selectedKey)?.label;

  /**
   * Fetches the content for a selected key from the API and transitions to the editor view.
   * @param {string} key - The unique key of the content to fetch.
   */
  const handleSelectContent = async (key: string) => {
    setSelectedKey(key);
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/site-content/${key}`);
      if (res.ok) {
        // If content exists, populate the editor with its data.
        const data = await res.json();
        setCurrentContent(data);
      } else if (res.status === 404) {
        // If content is not found, start with a blank state for creation.
        setCurrentContent({ title: "", content: "" });
      } else {
        throw new Error("Failed to fetch content");
      }
    } catch (err) {
      setError("An error occurred while fetching the content.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Saves the current content in the editor to the database via a PATCH request.
   */
  const handleSave = async () => {
    if (!selectedKey) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/site-content/${selectedKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentContent.title,
          content: currentContent.content,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save content");
      }
      setSuccess("Content saved successfully!");
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Renders the EDITOR VIEW if a content key is selected ---
  if (selectedKey) {
    return (
      <div className="py-6 space-y-6">
        <header>
          <Button variant="outline" onClick={() => setSelectedKey(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Content List
          </Button>
        </header>

        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle>Editing: {selectedLabel}</CardTitle>
            <CardDescription>
              Update the title and content for this page. Use Markdown for
              formatting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert
                variant="default"
                className="bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
              >
                <Terminal className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={currentContent.title || ""}
                onChange={(e) =>
                  setCurrentContent({
                    ...currentContent,
                    title: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown supported)</Label>
              <Textarea
                id="content"
                rows={15}
                className="font-mono"
                placeholder="Write your page content here..."
                value={currentContent.content || ""}
                onChange={(e) =>
                  setCurrentContent({
                    ...currentContent,
                    content: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- Renders the SELECTION VIEW by default ---
  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Manage Site Content</h1>
        <p className="text-muted-foreground">
          Update the content for key pages like 'About Us'.
        </p>
      </header>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle>Editable Content</CardTitle>
          <CardDescription>
            Select a page or content block to edit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contentKeys.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSelectContent(key)}
                className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">
                  Key: <code>{key}</code>
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
