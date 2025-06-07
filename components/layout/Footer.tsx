export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} TedBooks. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Crafted with ❤️ by John for book lovers.
        </p>
      </div>
    </footer>
  );
}
