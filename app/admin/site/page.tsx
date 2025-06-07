"use client";

import { useState } from "react";
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

// Define the content pieces that are editable by the admin
const contentKeys = [
  { key: "aboutPageContent", label: "About Us Page" },
  // Add other manageable content pages here in the future
  // { key: 'faqPageContent', label: 'FAQ Page' },
];

type ContentItem = {
  key: string;
  title: string;
  content: string;
};

export default function ManageSiteContentPage() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<Partial<ContentItem>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedLabel = contentKeys.find((c) => c.key === selectedKey)?.label;

  const handleSelectContent = async (key: string) => {
    setSelectedKey(key);
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/site-content/${key}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentContent(data);
      } else if (res.status === 404) {
        // Content doesn't exist yet, start with a blank slate
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

  if (selectedKey) {
    // --- EDITING VIEW ---
    return (
      <div className="py-6 space-y-6">
        <header>
          <Button variant="outline" onClick={() => setSelectedKey(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Content List
          </Button>
        </header>

        <Card className="rounded-xl shadow-lg">
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

  // --- SELECTION VIEW ---
  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">
          Manage Site Content
        </h1>
        <p className="text-muted-foreground">
          Update the content for key pages like 'About Us'.
        </p>
      </header>

      <Card className="rounded-xl shadow-lg">
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
