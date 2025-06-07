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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Order, OrderItem, UserProfile } from "@/types";
import { User, Package, Download, Phone, Loader2 } from "lucide-react";
import Link from "next/link";

// --- Child Component: ProfileSection ---
function ProfileSection({ profile }: { profile: UserProfile | null }) {
  if (!profile) {
    // Show a skeleton loader while profile is fetching
    return (
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle>Loading profile...</CardTitle>
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

  return (
    <Card className="shadow-lg rounded-2xl">
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
          <CardTitle className="text-3xl font-headline">
            {profile.name}
          </CardTitle>
          <CardDescription className="text-md">{profile.email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center text-sm">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Phone: {profile.phone || "Not Provided"}</span>
        </div>
        {/* You can add address here if you add it to your User model and API */}
      </CardContent>
      <CardFooter>
        {/* This would link to a future profile editing page */}
        <Button variant="outline" className="rounded-lg" disabled>
          Edit Profile
        </Button>
      </CardFooter>
    </Card>
  );
}

// --- Child Component: OrderCard ---
function OrderCard({ order }: { order: Order }) {
  return (
    <Card className="shadow-md rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/50 p-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <CardTitle className="text-lg font-headline">
              Order ID: {order.customId}
            </CardTitle>
            <CardDescription className="text-xs">
              Placed on: {new Date(order.date).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg text-primary">
              Ksh. {order.totalAmount.toFixed(2)}
            </p>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                order.status === "Completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                  : order.status === "Pending"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <h4 className="font-semibold text-md">Items:</h4>
        {order.items.map((item) => (
          <div key={item._id} className="flex items-center space-x-3">
            <Image
              src={item.coverImage}
              alt={item.title}
              width={40}
              height={60}
              className="rounded aspect-[2/3] object-cover"
            />
            <div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                Qty: {item.quantity} - Ksh. {item.priceAtPurchase.toFixed(2)}{" "}
                each
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// --- Child Component: OrdersSection ---
function OrdersSection({ orders }: { orders: Order[] | null }) {
  if (!orders) return null; // Or a loading state if passed separately

  return (
    <div className="space-y-6">
      {orders.length > 0 ? (
        orders.map((order) => <OrderCard key={order._id} order={order} />)
      ) : (
        <p className="text-muted-foreground text-center py-8">
          You have no orders yet.
        </p>
      )}
    </div>
  );
}

// --- Child Component: DownloadsSection ---
function DownloadsSection({ orders }: { orders: Order[] | null }) {
  if (!orders) return null;

  const downloadableItems: OrderItem[] = orders
    .filter((order) => order.status === "Completed")
    .flatMap((order) => order.items)
    .filter(
      (item): item is OrderItem & { downloadUrl: string } => !!item.downloadUrl
    );

  return (
    <Card className="shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">
          My Downloadable Books
        </CardTitle>
        <CardDescription>
          Access your purchased digital books here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {downloadableItems.length > 0 ? (
          <ul className="space-y-4">
            {downloadableItems.map((item) => (
              <li
                key={item._id}
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
                <Button asChild size="sm" className="rounded-lg">
                  <Link
                    href={item.downloadUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            You have no downloadable items.
          </p>
        )}
      </CardContent>
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
    // Middleware handles redirection, but this is a client-side safeguard.
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
            fetch("/api/orders"),
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
          <h1 className="text-4xl font-headline font-bold text-center">
            My Account
          </h1>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:max-w-md mx-auto mb-8 rounded-xl p-1.5 h-auto">
            <TabsTrigger
              value="profile"
              className="py-2.5 text-sm md:text-base rounded-lg data-[state=active]:shadow-md"
            >
              <User className="mr-2 h-5 w-5" /> Profile
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="py-2.5 text-sm md:text-base rounded-lg data-[state=active]:shadow-md"
            >
              <Package className="mr-2 h-5 w-5" /> Orders
            </TabsTrigger>
            <TabsTrigger
              value="downloads"
              className="py-2.5 text-sm md:text-base rounded-lg data-[state=active]:shadow-md"
            >
              <Download className="mr-2 h-5 w-5" /> Downloads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection profile={profile} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersSection orders={orders} />
          </TabsContent>
          <TabsContent value="downloads">
            <DownloadsSection orders={orders} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
