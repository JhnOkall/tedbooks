/**
 * @file This file defines the main "My Account" page.
 * It has been refactored to a single-view layout, combining profile information
 * and downloadable content. The tabbed interface has been removed for a
 * simpler user experience.
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import type { Order, OrderItem, UserProfile } from "@/types";
import { Download, Loader2 } from "lucide-react";

// --- Helper type for downloadable items ---
type DownloadableItem = OrderItem & { parentOrderId: string };

// --- NEW Combined Component: ProfileAndDownloadsSection ---
/**
 * Renders a single card containing both the user's profile information
 * and a list of their downloadable purchases.
 */
function ProfileAndDownloadsSection({
  profile,
  orders,
}: {
  profile: UserProfile | null;
  orders: Order[] | null;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);

  // --- Loading State for the card ---
  if (!profile) {
    return (
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Loading your account...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-muted"></div>
              <div className="space-y-2">
                <div className="h-6 w-48 rounded bg-muted"></div>
                <div className="h-4 w-64 rounded bg-muted"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Prepare downloadable items from completed orders ---
  const downloadableItems: DownloadableItem[] =
    orders
      ?.filter((order) => order.status === "Completed")
      .flatMap((order) =>
        order.items.map((item) => ({ ...item, parentOrderId: order._id }))
      ) || [];

  /**
   * Handles the secure download process without opening a new tab.
   */
  const handleDownload = async (item: DownloadableItem) => {
    if (downloading) return;

    setDownloading(item.book);
    const loadingToast = toast.loading(
      `Preparing download for "${item.title}"...`
    );

    try {
      const res = await fetch(`/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: item.parentOrderId,
          bookId: item.book,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Could not get download link.");
      }

      const { url } = await res.json();

      // **THE FIX**: Create a temporary link to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", ""); // Optional, helps browsers
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); // Clean up the DOM

      toast.dismiss(loadingToast);
      toast.success("Your download is starting!");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Download Failed", { description: error.message });
    } finally {
      setDownloading(null);
    }
  };

  // --- Render the combined view ---
  return (
    <Card className="shadow-lg rounded-lg">
      {/* Profile Header */}
      <CardHeader className="flex flex-row items-center space-x-4 pb-4">
        <Avatar className="h-20 w-20 border-2 border-primary">
          {profile.image && (
            <AvatarImage src={profile.image} alt={profile.name} />
          )}
          <AvatarFallback>
            {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-3xl">{profile.name}</CardTitle>
          <CardDescription className="text-md">{profile.email}</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* Separator and Downloads Section */}
        <Separator className="my-6" />
        <div>
          <h3 className="text-2xl font-semibold mb-4">My Downloads</h3>
          {downloadableItems.length > 0 ? (
            <ul className="space-y-4">
              {downloadableItems.map((item) => (
                <li
                  key={`${item.parentOrderId}-${item.book}`}
                  className="flex items-center justify-between p-3 border rounded-lg shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      width={50}
                      height={75}
                      className="rounded object-cover aspect-[2/3]"
                    />
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        by {item.author}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-lg w-[120px]"
                    onClick={() => handleDownload(item)}
                    disabled={downloading === item.book}
                  >
                    {downloading === item.book ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              You have no downloadable items yet.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="rounded-lg" disabled>
          Edit Profile
        </Button>
      </CardFooter>
    </Card>
  );
}

// --- Main Page Component ---
export default function AccountPage() {
  const { status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin?callbackUrl=/account");
      return;
    }

    if (status === "authenticated") {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [profileRes, ordersRes] = await Promise.all([
            fetch("/api/users/me"),
            fetch("/api/orders"), // Still fetch orders for the downloads list
          ]);

          if (profileRes.ok) setProfile(await profileRes.json());
          if (ordersRes.ok) setOrders(await ordersRes.json());
        } catch (error) {
          console.error("Failed to fetch account data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-center">My Account</h1>
        </header>

        {/* The new, simplified content area */}
        <div className="max-w-4xl mx-auto">
          <ProfileAndDownloadsSection profile={profile} orders={orders} />
        </div>
      </div>
    </MainLayout>
  );
}
