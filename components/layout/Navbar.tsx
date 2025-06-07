/**
 * @file Defines the main Navbar component for the application.
 * This is a client component responsible for site-wide navigation, displaying user
 * authentication status, and providing access to the theme toggle, cart, and user menu.
 */

"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { CartIcon } from "@/components/cart/CartIcon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  BookOpen,
  Info,
  User,
  LogOut,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSession, signIn, signOut } from "next-auth/react";

/**
 * Configuration for the main navigation links.
 * Storing this in an array makes it easy to manage and render the navigation bar.
 */
// TODO: For a more dynamic site, consider fetching navigation links from a CMS
// or a configuration API to allow non-developers to manage the site structure.
const navLinks = [
  { href: "/", label: "Home", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/shop", label: "Shop", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/about", label: "About", icon: <Info className="h-4 w-4" /> },
];

/**
 * The primary navigation bar component for the website.
 * It is responsive and adapts its layout for desktop and mobile views.
 */
export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;

  /**
   * A reusable component to render the navigation links.
   * This avoids code duplication between the desktop and mobile navigation menus.
   * @param {object} props - The component props.
   * @param {boolean} [props.isMobile=false] - If true, applies styles suitable for a mobile layout.
   */
  const NavLinksContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {navLinks.map((link) => (
        <Button
          key={link.href}
          asChild
          variant="ghost"
          className={cn(
            "font-medium",
            // Apply active link styling based on the current pathname.
            pathname === link.href
              ? "text-primary"
              : "text-foreground/70 hover:text-foreground",
            isMobile ? "w-full justify-start text-lg py-4" : ""
          )}
        >
          <Link href={link.href} className="flex items-center gap-2">
            {isMobile && link.icon}
            {link.label}
          </Link>
        </Button>
      ))}
      {/* Conditionally render the "Admin" link only for users with the 'admin' role. */}
      {user?.role === "admin" && (
        <Button
          asChild
          variant="ghost"
          className={cn(
            "font-medium",
            pathname.startsWith("/admin")
              ? "text-primary"
              : "text-foreground/70 hover:text-foreground",
            isMobile ? "w-full justify-start text-lg py-4" : ""
          )}
        >
          {/* TODO: Centralize application routes (e.g., '/admin') into a constants file
          to improve maintainability and prevent magic strings. */}
          <Link href="/admin" className="flex items-center gap-2">
            {isMobile && <LayoutDashboard className="h-4 w-4" />}
            Admin
          </Link>
        </Button>
      )}
    </>
  );

  return (
    // The header uses sticky positioning and backdrop-blur for a modern "glassmorphism" effect.
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        {/* Desktop Navigation: Hidden on smaller screens */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <NavLinksContent />
        </nav>
        <div className="flex items-center space-x-2">
          <CartIcon />
          <ThemeToggle />

          {/* Handles the display of authentication status */}
          {status === "loading" && (
            // Shows a skeleton loader while the session is being fetched, preventing layout shifts.
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          )}

          {status === "unauthenticated" && (
            <Button
              onClick={() => signIn("google")}
              variant="outline"
              size="sm"
              className="rounded-lg"
            >
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </Button>
          )}

          {status === "authenticated" && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    {user.image && (
                      <AvatarImage src={user.image} alt={user.name || "User"} />
                    )}
                    <AvatarFallback>
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Account</span>
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Navigation: A hamburger menu that shows a Sheet on smaller screens */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] p-6">
                <div className="mb-6">
                  <Logo />
                </div>
                <div className="flex flex-col space-y-2">
                  <NavLinksContent isMobile />
                  <Separator className="my-2" />
                  {/* Authentication links within the mobile menu */}
                  {status === "authenticated" && user && (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start text-lg py-4"
                      >
                        <Link
                          href="/account"
                          className="flex items-center gap-2"
                        >
                          <User className="h-5 w-5" /> My Account
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-lg py-4 text-destructive hover:text-destructive"
                        onClick={() => signOut()}
                      >
                        <LogOut className="h-5 w-5 mr-2" /> Sign Out
                      </Button>
                    </>
                  )}
                  {status === "unauthenticated" && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-lg py-4"
                      onClick={() => signIn("google")}
                    >
                      <LogIn className="h-5 w-5 mr-2" /> Sign In
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
