"use client";

import { useState } from "react";
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

export default function AddNewContentPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/site-content/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create content.");
      }

      // On success, redirect back to the main content management page
      router.push("/admin/content");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">
          Add New Site Content
        </h1>
        <p className="text-muted-foreground">
          Define a new editable content block for your website.
        </p>
      </header>

      <Card className="rounded-xl shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
            <CardDescription>
              The 'key' must be a unique identifier (e.g., 'privacyPolicy').
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
