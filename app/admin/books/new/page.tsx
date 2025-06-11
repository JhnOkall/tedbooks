/**
 * @file This file defines the server-rendered page for adding a new book.
 * It provides the main layout and imports the client-side form component.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddBookForm } from "@/components/admin/add-book-form";

/**
 * The main page component for adding a new book. This is a Server Component.
 */
export default function AddNewBookPage() {
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
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
          <CardDescription>
            Enter information for the new book. Files will upload automatically
            when selected.
          </CardDescription>
        </CardHeader>
        <AddBookForm /> {/* Render the interactive client component here */}
      </Card>
    </div>
  );
}
