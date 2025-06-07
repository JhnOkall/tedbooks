import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { ISiteContent } from "@/models/SiteContent";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// --- Data Fetching Function ---
// Fetches content for the 'about' page from our API.
// 'no-store' ensures we always get the latest version from the DB.
async function getAboutContent(): Promise<ISiteContent | null> {
  // IMPORTANT: Set this in your .env.local file
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/site-content/aboutPageContent`, {
      cache: "no-store",
    });

    if (!res.ok) {
      // If content not found (404) or other error, return null
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch about page content:", error);
    return null;
  }
}

// --- The Default Fallback Content ---
const FallbackContent = () => (
  <>
    <p>
      Welcome to TedBooks, your premier destination for discovering and
      purchasing your next favorite book. We believe in the power of stories to
      inspire, educate, and entertain. Our mission is to provide an elegant,
      minimalist, and enjoyable shopping experience for book lovers everywhere.
    </p>
    <p>Please ask an administrator to set the content for this page.</p>
    <p className="font-semibold text-center text-primary pt-4">
      Happy Reading!
    </p>
  </>
);

// --- The Page Component (now async) ---
export default async function AboutPage() {
  const aboutData = await getAboutContent();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <Card className="max-w-3xl mx-auto rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-headline text-center">
              {aboutData?.title || "About TedBooks"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-lg text-foreground/80">
            {aboutData?.content ? (
              // Render the dynamic content using ReactMarkdown
              // The 'prose' classes from @tailwindcss/typography will style the output
              <article className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown>{aboutData.content}</ReactMarkdown>
              </article>
            ) : (
              // Show fallback content if nothing is fetched
              <FallbackContent />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
