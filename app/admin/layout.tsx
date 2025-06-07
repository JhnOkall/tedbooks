import type { ReactNode } from "react";
import Link from "next/link";
import { Home, BookCopy, Package, LayoutDashboard, Cog } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Separator } from "@/components/ui/separator";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavLinks = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/admin/books",
    label: "Manage Books",
    icon: <BookCopy className="h-5 w-5" />,
  },
  {
    href: "/admin/orders",
    label: "Manage Orders",
    icon: <Package className="h-5 w-5" />,
  },
  {
    href: "/admin/site",
    label: "Site Content",
    icon: <Cog className="h-5 w-5" />,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        {/* Mobile menu can be added here if needed */}
      </header>
      <div className="flex min-h-screen w-full">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
          <div className="flex h-16 items-center border-b px-6">
            <Logo />
          </div>
          <nav className="flex-1 overflow-auto py-4">
            <ul className="grid items-start px-4 text-sm font-medium">
              {adminNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                </li>
              ))}
              <Separator className="my-4" />
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                >
                  <Home className="h-5 w-5" />
                  Back to Site
                </Link>
              </li>
            </ul>
          </nav>
          <div className="mt-auto p-4 border-t">
            <ThemeToggle />
          </div>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-72 flex-1">
          {" "}
          {/* Adjusted sm:pl-72 to account for wider sidebar */}
          <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 bg-background">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
