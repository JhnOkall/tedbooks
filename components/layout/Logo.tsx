import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="text-2xl font-headline font-bold text-primary hover:text-primary/80 transition-colors"
    >
      TedBooks
    </Link>
  );
}
