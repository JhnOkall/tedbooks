"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
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

interface ContentData {
  title: string;
  content: string;
}

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const key = params.key as string;

  const [contentData, setContentData] = useState<Partial<ContentData>>({});
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          // If the key doesn't exist, we can treat this as a creation page
          setContentData({ title: "", content: "" });
          setError(
            `Content with key '${key}' not found. You can create it here.`
          );
        } else {
          throw new Error("Failed to load content.");
        }
      } catch (err) {
        setError("An error occurred while fetching content.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [key]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

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

      setSuccess("Content saved successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">
          Edit Content: <code>{key}</code>
        </h1>
        <p className="text-muted-foreground">
          Modify the details for this content block.
        </p>
      </header>

      <Card className="rounded-xl shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
            <CardDescription>
              Update the information below. Markdown is supported.
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
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Content
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
