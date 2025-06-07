/**
 * @file Defines the ThemeToggle component, a client-side component that allows users
 * to switch between light, dark, and system color schemes for the application.
 */

"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JSX, useEffect, useState } from "react";

/**
 * A user interface control for switching the application's theme.
 * It uses the `next-themes` library to manage theme state and persists the
 * user's preference. This component handles hydration by only rendering
 * its full interactive state on the client-side after mounting.
 *
 * @returns {JSX.Element} The rendered theme toggle dropdown component.
 */
export function ThemeToggle(): JSX.Element {
  const { setTheme, theme } = useTheme();

  // The `mounted` state is used to prevent hydration mismatches.
  // On the server, the theme is unknown, so a placeholder is rendered.
  // On the client, this effect runs, sets `mounted` to true, and the component
  // re-renders with the correct, theme-aware UI.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Before the component is mounted on the client, render a static,
  // disabled placeholder to ensure a consistent server-rendered and initial
  // client-rendered UI, avoiding React hydration errors.
  if (!mounted) {
    // TODO: Consider replacing the disabled button with a skeleton loader
    // for a more consistent loading state across the application.
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          {/* The button displays either a Sun or Moon icon based on the current theme. */}
          {/* The icons use CSS transitions for a smooth rotation and scaling effect. */}
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Each menu item sets the theme to a specific value when clicked. */}
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          // The currently active theme is highlighted for visual feedback.
          className={theme === "light" ? "bg-accent" : ""}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={theme === "dark" ? "bg-accent" : ""}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={theme === "system" ? "bg-accent" : ""}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
