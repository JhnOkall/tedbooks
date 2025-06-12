/**
 * @file This file defines the main Admin Dashboard page and its sub-components.
 * It is a client component that fetches and displays key metrics from both the
 * internal database and the external PayHero payment service, and allows for
 * management of automated and manual employee payouts.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Trash2,
  Coins,
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
type PayoutConfig = {
  _id: string;
  name: string;
  phone: string;
  payoutPercentage: number;
  payoutFrequency: "weekly" | "monthly";
};

/**
 * A helper function to format a number as Kenyan Shillings.
 */
const formatCurrency = (amount: number): string => `Ksh. ${amount.toFixed(2)}`;

/**
 * The main component for the Admin Dashboard page.
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
   * Can be called to refresh all data on the dashboard.
   */
  const fetchDashboardData = async () => {
    // Only show the main loader on the initial fetch
    if (!stats) setIsLoading(true);

    try {
      const [statsRes, walletsRes, transactionsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/payhero/balance"),
        fetch("/api/admin/payhero/transactions?per=5"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (walletsRes.ok) setWallets(await walletsRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
    } catch (error) {
      toast.error("Failed to load some dashboard data.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      <div className="grid gap-4 md:grid-cols-3">
        <PayHeroWalletsCard wallets={wallets} />
        <TopUpCard onSuccessfulTopUp={fetchDashboardData} />
      </div>

      <PayoutManagementCard onPayoutSuccess={fetchDashboardData} />

      <RecentTransactionsTable data={transactions} />
    </div>
  );
}

// --- Sub-Components ---

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

function PayHeroWalletsCard({ wallets }: { wallets: Wallets | null }) {
  return (
    <Card className="md:col-span-1 rounded-lg shadow-md">
      <CardHeader>
        <CardTitle>PayHero Wallets</CardTitle>
        <CardDescription>Your current account balances.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3 p-3 border rounded-lg">
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
        <div className="flex items-center space-x-3 p-3 border rounded-lg">
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
      </CardContent>
    </Card>
  );
}

function TopUpCard({ onSuccessfulTopUp }: { onSuccessfulTopUp: () => void }) {
  const [isToppingUp, setIsToppingUp] = useState(false);

  const handleTopUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsToppingUp(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      amount: Number(formData.get("amount")),
      phone_number: formData.get("phone_number") as string,
    };
    toast.info("Sending STK push...");
    try {
      const res = await fetch("/api/admin/payhero/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Top-up request failed.");
      toast.success("STK push sent!", {
        description: "Enter your PIN to complete.",
      });
      setTimeout(onSuccessfulTopUp, 30000); // Refresh balance after 30s for confirmation
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
        <CardDescription>Add funds via M-Pesa STK push.</CardDescription>
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

function PayoutManagementCard({
  onPayoutSuccess,
}: {
  onPayoutSuccess: () => void;
}) {
  const [configs, setConfigs] = useState<PayoutConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutInProgressId, setPayoutInProgressId] = useState<string | null>(
    null
  );

  const fetchConfigs = async () => {
    setIsLoading(true);
    const res = await fetch("/api/admin/payouts");
    if (res.ok) setConfigs(await res.json());
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleAddConfig = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      payoutPercentage: Number(formData.get("percentage")),
      payoutFrequency: formData.get("frequency"),
    };
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Payout configuration added!");
      await fetchConfigs();
      (event.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error("Failed to add", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    toast.promise(fetch(`/api/admin/payouts/${id}`, { method: "DELETE" }), {
      loading: "Deleting...",
      success: () => {
        fetchConfigs();
        return "Configuration deleted.";
      },
      error: "Deletion failed.",
    });
  };

  const handlePayoutNow = async (configId: string, configName: string) => {
    setPayoutInProgressId(configId);
    toast.promise(
      fetch(`/api/admin/payouts/${configId}/payout-now`, {
        method: "POST",
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message);
        }
        onPayoutSuccess(); // Refresh dashboard wallet balances
        return `Payout for ${configName} initiated!`;
      }),
      {
        loading: `Initiating payout for ${configName}...`,
        success: (message) => message,
        error: (err) => err.message || "An unexpected error occurred.",
        finally: () => setPayoutInProgressId(null),
      }
    );
  };

  const totalPercentage = configs.reduce(
    (sum, c) => sum + c.payoutPercentage,
    0
  );

  return (
    <Card className="rounded-lg shadow-md col-span-full">
      <CardHeader>
        <CardTitle>Payout Management</CardTitle>
        <CardDescription>
          Configure automated & manual payouts from the payments wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleAddConfig} className="md:col-span-1 space-y-4">
          <h3 className="font-semibold">Add New Employee</h3>
          <Input
            name="name"
            placeholder="Employee Name"
            required
            disabled={isSubmitting}
          />
          <Input
            name="phone"
            placeholder="Phone (e.g., 07...)"
            required
            disabled={isSubmitting}
          />
          <Input
            name="percentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="Payout %"
            required
            disabled={isSubmitting}
          />
          <Select name="frequency" required>
            <SelectTrigger disabled={isSubmitting}>
              <SelectValue placeholder="Select Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
            Add Configuration
          </Button>
        </form>
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Current Configurations</h3>
            <p
              className={`text-sm font-bold ${
                totalPercentage > 100 ? "text-destructive" : "text-primary"
              }`}
            >
              Total Allocated: {totalPercentage.toFixed(1)}%
            </p>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Frequency
                  </TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">
                        {c.name}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {c.phone}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell capitalize">
                        {c.payoutFrequency}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.payoutPercentage}%
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center space-x-1">
                          {payoutInProgressId === c._id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePayoutNow(c._id, c.name)}
                            >
                              <Coins className="mr-2 h-4 w-4" /> Pay Now
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteConfig(c._id)}
                            disabled={!!payoutInProgressId}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
