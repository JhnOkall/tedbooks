/**
 * @file This file defines the admin page for managing customer orders.
 * It provides a table view of all orders and allows administrators to update their status.
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Order } from "@/types";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Define the type for the order status more strictly.
type OrderStatus = "Pending" | "Completed" | "Cancelled";

/**
 * The main component for the "Manage Orders" admin page. It fetches and displays
 * all orders and provides controls for status updates.
 */
export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State to track which specific order is currently being updated to show a loader.
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  /**
   * Effect hook to fetch all orders from the API when the component mounts.
   */
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) {
          throw new Error("Failed to fetch orders.");
        }
        const data = await res.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  /**
   * Handles the change of an order's status. It sends a PATCH request to the API
   * and optimistically updates the local state for a responsive user experience.
   *
   * @param {string} orderId - The ID of the order to update.
   * @param {OrderStatus} newStatus - The new status to set for the order.
   */
  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    setUpdatingOrderId(orderId);

    // Use a toast promise for better async feedback to the user.
    toast.promise(
      fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }),
      {
        loading: "Updating order status...",
        success: (res) => {
          if (!res.ok) throw new Error("Update failed.");
          // Optimistically update the local state to reflect the change immediately.
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order._id === orderId ? { ...order, status: newStatus } : order
            )
          );
          return `Order status updated to ${newStatus}.`;
        },
        error: "Failed to update order.",
        finally: () => setUpdatingOrderId(null),
      }
    );
  };

  /**
   * A helper function to determine the visual variant of the status badge.
   * @param {OrderStatus} status - The current status of the order.
   * @returns {'success' | 'default' | 'destructive' | 'outline'} The badge variant.
   */
  const getStatusBadgeVariant = (
    status: OrderStatus
  ): "success" | "default" | "destructive" | "outline" => {
    switch (status) {
      case "Completed":
        return "success";
      case "Pending":
        return "default";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Displays a loading spinner while the initial data is being fetched.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Displays an error message if the data fetch fails.
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Manage Orders</h1>
        <p className="text-muted-foreground">
          View and process customer orders.
        </p>
      </header>

      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>
            A list of all customer orders in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No orders found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* TODO: Implement pagination for the orders table to handle a large number of records efficiently. */}
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">
                      {order.customId}
                    </TableCell>
                    <TableCell>
                      {new Date(order.date).toLocaleDateString()}
                    </TableCell>
                    {/* The API populates `userId` with the user object, but we cast to `any` for simplicity.
                        A better approach would be to extend the `Order` type to reflect the populated field. */}
                    <TableCell>
                      {(order.userId as any)?.name || "N/A"}
                    </TableCell>
                    {/* TODO: The currency 'Ksh.' is hardcoded. Use a centralized currency formatter. */}
                    <TableCell className="text-right">
                      Ksh. {order.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center w-48">
                      {/* Show a loader in place of the select menu while this specific order is updating. */}
                      {updatingOrderId === order._id ? (
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                        <Select
                          defaultValue={order.status}
                          onValueChange={(value: OrderStatus) =>
                            handleStatusChange(order._id, value)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
