/**
 * @file This file defines the "About Us" page for the application.
 * It is a dynamically rendered server component that fetches its content from the
 * SiteContent API, with a built-in fallback for resilience.
 */

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { ISiteContent } from "@/models/SiteContent";
import { JSX } from "react";

/**
 * Ensures that this page is dynamically rendered on every request.
 * This is useful for content that may be updated frequently in a CMS, as it
 * guarantees that users always see the most up-to-date version.
 */
export const dynamic = "force-dynamic";

/**
 * Fetches the 'about' page content from the internal API.
 * This function is designed to be resilient, returning `null` on any fetch error
 * or if the content is not found (404), allowing the page to use fallback content.
 *
 * @returns {Promise<ISiteContent | null>} A promise that resolves to the site content object or null on failure.
 */
async function getAboutContent(): Promise<ISiteContent | null> {
  // TODO: Centralize the `baseUrl` retrieval logic into a shared utility function to avoid repetition.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const contentKey = "aboutPageContent"; // The unique key for the about page content.

  try {
    const res = await fetch(`${baseUrl}/api/site-content/${contentKey}`, {
      // Ensures that the data is always fetched from the source, bypassing any cache.
      cache: "no-store",
    });

    // If the content is not found (404) or another error occurs, return null.
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    // TODO: Integrate a robust logging service for production error tracking.
    console.error("Failed to fetch about page content:", error);
    return null;
  }
}

/**
 * A component that provides default, hardcoded content for the "About Us" page.
 * This is displayed if the dynamic content cannot be fetched from the API,
 * ensuring the page remains functional and informative.
 */
const FallbackContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-none">
    <p>
      Welcome to TedBooks, your premier destination for discovering and
      purchasing your next favorite book. I believe in the power of stories to
      inspire, educate, and entertain. My mission is to provide an elegant,
      minimalist, and enjoyable shopping experience for book lovers everywhere.
    </p>
    <p className="font-semibold text-center pt-4">Happy Reading!</p>
  </div>
);

/**
 * The main server component for the "About Us" page.
 * It fetches dynamic content and renders it, falling back to a default state if necessary.
 *
 * @returns {Promise<JSX.Element>} A promise that resolves to the rendered page component.
 */
export default async function AboutPage(): Promise<JSX.Element> {
  const aboutData = await getAboutContent();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <Card className="max-w-3xl mx-auto rounded-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl text-center">
              {/* Use the fetched title, or a default title if data is unavailable. */}
              {aboutData?.title || "About TedBooks"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-lg text-foreground/80">
            {aboutData?.content ? (
              // If content was successfully fetched, render it using ReactMarkdown.
              // The 'prose' classes from @tailwindcss/typography provide default styling for the Markdown output.
              <article className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown>{aboutData.content}</ReactMarkdown>
              </article>
            ) : (
              // Otherwise, render the hardcoded fallback content.
              <FallbackContent />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
