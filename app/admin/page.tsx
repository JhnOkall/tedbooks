"use client";

import { useEffect, useState } from "react";
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
  Wallet,
  Landmark,
  Fuel,
} from "lucide-react";

// Define types for our fetched data
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

// Helper to format currency
const formatCurrency = (amount: number) => `Ksh. ${amount.toFixed(2)}`;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [wallets, setWallets] = useState<Wallets | null>(null);
  const [transactions, setTransactions] = useState<TransactionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, walletsRes, transactionsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/payhero/balance"),
        fetch("/api/admin/payhero/transactions?per=5"), // Fetch latest 5 transactions
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
        <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your bookstore and finances.
        </p>
      </header>

      {/* Internal Stats Cards */}
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

      {/* PayHero Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <PayHeroWalletsCard wallets={wallets} />
        <TopUpCard onSuccessfulTopUp={fetchDashboardData} />
      </div>

      {/* Recent Transactions Table */}
      <RecentTransactionsTable data={transactions} />
    </div>
  );
}

// --- Sub-Components for a Cleaner Dashboard ---

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card className="rounded-xl shadow-lg">
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
    <Card className="md:col-span-1 rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">PayHero Wallets</CardTitle>
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

function TopUpCard({ onSuccessfulTopUp }: { onSuccessfulTopUp: () => void }) {
  const [isToppingUp, setIsToppingUp] = useState(false);

  const handleTopUp = async (event: React.FormEvent<HTMLFormElement>) => {
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
      // Optionally, poll for balance update or just let user know to wait
      setTimeout(onSuccessfulTopUp, 30000); // Refresh balance after 30s
    } catch (error: any) {
      toast.error("Top-up Failed", { description: error.message });
    } finally {
      setIsToppingUp(false);
      (event.target as HTMLFormElement).reset();
    }
  };

  return (
    <Card className="md:col-span-2 rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Top Up Service Wallet</CardTitle>
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
            {isToppingUp ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Initiate Top-Up
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RecentTransactionsTable({ data }: { data: TransactionData | null }) {
  return (
    <Card className="rounded-xl shadow-lg">
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
                      {tx.transaction_type.replace("_", " ")}
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
