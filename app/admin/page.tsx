/**
 * @file This file defines the main Admin Dashboard page and its sub-components.
 * It is a client component that fetches and displays key metrics from both the
 * internal database and the external PayHero payment service.
 */

"use client";

import { useEffect, useState, FormEvent, ReactNode } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  DollarSign,
  Users,
  ShoppingCart,
  Loader2,
  Landmark,
  Fuel,
} from "lucide-react";

/**
 * Type definitions for the data fetched from various API endpoints.
 */
type Stats = {
  bookCount: number;
  userCount: number;
  totalRevenue: number;
  completedOrders: number;
};
type Wallets = { serviceBalance: number; paymentsBalance: number };
type Transaction = {
  id: number;
  transaction_type: string;
  description: string;
  amount: number;
  created_at: string;
};
type TransactionData = { transactions: Transaction[]; pagination: any };

/**
 * A helper function to format a number as Kenyan Shillings.
 * @param {number} amount - The numeric amount to format.
 * @returns {string} The formatted currency string.
 */
const formatCurrency = (amount: number): string => `Ksh. ${amount.toFixed(2)}`;

/**
 * The main component for the Admin Dashboard page. It orchestrates data fetching
 * and renders the various informational sections.
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [wallets, setWallets] = useState<Wallets | null>(null);
  const [transactions, setTransactions] = useState<TransactionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches all required dashboard data in parallel from the relevant API endpoints.
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // TODO: Centralize API route paths into a shared constants file for better maintainability.
      const [statsRes, walletsRes, transactionsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/payhero/balance"),
        fetch("/api/admin/payhero/transactions?per=5"), // Fetch the 5 most recent transactions.
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (walletsRes.ok) setWallets(await walletsRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      // TODO: Add specific error handling for non-ok responses to provide more granular feedback.
    } catch (error) {
      toast.error("Failed to load some dashboard data.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when the component mounts.
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Displays a loading spinner while initial data is being fetched.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your bookstore and finances.
        </p>
      </header>

      {/* Internal Application Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BookOpen />}
          title="Total Books"
          value={stats?.bookCount.toLocaleString() || "0"}
        />
        <StatCard
          icon={<DollarSign />}
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : "..."}
        />
        <StatCard
          icon={<ShoppingCart />}
          title="Completed Orders"
          value={stats?.completedOrders.toLocaleString() || "0"}
        />
        <StatCard
          icon={<Users />}
          title="Total Users"
          value={stats?.userCount.toLocaleString() || "0"}
        />
      </div>

      {/* External PayHero Service Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <PayHeroWalletsCard wallets={wallets} />
        <TopUpCard onSuccessfulTopUp={fetchDashboardData} />
      </div>

      {/* Recent Transactions from PayHero */}
      <RecentTransactionsTable data={transactions} />
    </div>
  );
}

// --- Sub-Components ---

/**
 * A reusable card component for displaying a single statistic.
 */
function StatCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

/**
 * A card component for displaying PayHero wallet balances.
 */
function PayHeroWalletsCard({ wallets }: { wallets: Wallets | null }) {
  return (
    <Card className="md:col-span-1 rounded-lg shadow-md">
      <CardHeader>
        <CardTitle>PayHero Wallets</CardTitle>
        <CardDescription>Your current account balances.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Fuel className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Service Wallet</p>
              <p className="text-xl font-bold">
                {wallets ? (
                  formatCurrency(wallets.serviceBalance)
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Landmark className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Payments Wallet</p>
              <p className="text-xl font-bold">
                {wallets ? (
                  formatCurrency(wallets.paymentsBalance)
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * A card component with a form to initiate an M-Pesa STK push for topping up the service wallet.
 */
function TopUpCard({ onSuccessfulTopUp }: { onSuccessfulTopUp: () => void }) {
  const [isToppingUp, setIsToppingUp] = useState(false);

  /**
   * Handles the form submission to initiate the top-up process.
   * @param {FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleTopUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsToppingUp(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      amount: Number(formData.get("amount")),
      phone_number: formData.get("phone_number") as string,
    };

    toast.info("Sending STK push to your phone...");

    try {
      const res = await fetch("/api/admin/payhero/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Top-up request failed.");

      toast.success("STK push sent!", {
        description: "Please enter your PIN to complete the transaction.",
      });
      // TODO: Implement a more robust mechanism like WebSockets or server-sent events
      // to update the balance in real-time upon successful payment, instead of a timeout.
      setTimeout(onSuccessfulTopUp, 30000); // Refresh balance after 30 seconds.
    } catch (error: any) {
      toast.error("Top-up Failed", { description: error.message });
    } finally {
      setIsToppingUp(false);
      (event.target as HTMLFormElement).reset();
    }
  };

  return (
    <Card className="md:col-span-2 rounded-lg shadow-md">
      <CardHeader>
        <CardTitle>Top Up Service Wallet</CardTitle>
        <CardDescription>
          Add funds to your service wallet via M-Pesa STK push.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTopUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="e.g., 100"
              required
              disabled={isToppingUp}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">M-Pesa Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              placeholder="e.g., 0712345678"
              required
              disabled={isToppingUp}
            />
          </div>
          <Button type="submit" disabled={isToppingUp} className="w-full">
            {isToppingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Initiate Top-Up
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * A component that displays recent PayHero transactions in a table.
 */
function RecentTransactionsTable({ data }: { data: TransactionData | null }) {
  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle>Recent PayHero Transactions</CardTitle>
        <CardDescription>
          Your latest financial movements from PayHero.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Description
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.transactions.length ? (
                data.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="hidden sm:table-cell font-medium capitalize">
                      {tx.transaction_type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        tx.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No recent transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
