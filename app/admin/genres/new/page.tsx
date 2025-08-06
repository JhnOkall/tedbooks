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
import { AddGenreForm } from "@/components/admin/add-genre-form";

export default function AddNewGenrePage() {
  return (
    <div className="py-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Add New Genre</h1>
          <p className="text-muted-foreground">
            Fill in the details to add a new genre to your store.
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-lg">
          <Link href="/admin/genres">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Genres
          </Link>
        </Button>
      </header>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle>Genre Details</CardTitle>
          <CardDescription>
            The slug will be generated automatically from the name.
          </CardDescription>
        </CardHeader>
        <AddGenreForm />
      </Card>
    </div>
  );
}
