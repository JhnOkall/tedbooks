/**
 * @file This file defines the main layout for the administrative section of the application.
 * It provides a consistent sidebar for navigation on desktop and a slide-out sheet menu for mobile devices.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Home,
  BookCopy,
  Package,
  LayoutDashboard,
  Cog,
  Menu,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * Defines the props accepted by the AdminLayout component.
 */
interface AdminLayoutProps {
  /**
   * The main content to be rendered within the admin layout.
   */
  children: ReactNode;
}

/**
 * Configuration array for the navigation links displayed in the admin sidebar.
 * Storing this as a constant makes the navigation structure easy to manage and update.
 */
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

/**
 * A reusable component that renders the list of admin navigation links.
 * It is used in both the desktop sidebar and the mobile sheet menu to avoid code duplication.
 * The `SheetClose` component is used to automatically close the mobile menu upon navigation.
 */
const NavLinks = () => (
  // TODO: Implement active link styling. The `usePathname` hook can be used here
  // to compare the current route with the link's `href` and apply a different
  // background or text color to the active link for better user feedback.
  <ul className="grid items-start px-4 text-sm font-medium">
    {adminNavLinks.map((link) => (
      <li key={link.href}>
        <SheetClose asChild>
          <Link
            href={link.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            {link.icon}
            {link.label}
          </Link>
        </SheetClose>
      </li>
    ))}
    <Separator className="my-4" />
    <li>
      <SheetClose asChild>
        {/* TODO: Centralize all application route paths (e.g., '/', '/admin') into a
        shared constants file to improve maintainability and avoid magic strings. */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
        >
          <Home className="h-5 w-5" />
          Back to Site
        </Link>
      </SheetClose>
    </li>
  </ul>
);

/**
 * The main layout component for the admin dashboard.
 * @param {AdminLayoutProps} props - The props for the component.
 * @returns {JSX.Element} The rendered admin layout with page content.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-muted/40">
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar: Fixed position, visible on 'sm' screens and up. */}
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
          <div className="flex h-16 items-center border-b px-6">
            <Logo />
          </div>
          <nav className="flex-1 overflow-auto py-4">
            <NavLinks />
          </nav>
          <div className="mt-auto p-4 border-t">
            <ThemeToggle />
          </div>
        </aside>

        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            {/* Mobile Menu: A hamburger button that triggers a slide-out sheet. */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:hidden p-0 flex flex-col">
                <div className="flex h-16 items-center border-b px-6">
                  <Logo />
                </div>
                <nav className="flex-1 overflow-auto py-4">
                  <NavLinks />
                </nav>
                <div className="mt-auto p-4 border-t">
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
