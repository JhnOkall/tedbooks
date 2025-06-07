/**
 * @file This file defines the static Terms and Conditions page for the application.
 * It outlines the rules and agreements for using the service.
 */

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { JSX } from "react";

/**
 * A reusable helper component to structure sections within a policy page.
 * It provides a consistent heading and uses Tailwind's `prose` classes for readable content styling.
 *
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the policy section.
 * @param {React.ReactNode} props.children - The content of the section.
 * @returns {JSX.Element} The rendered policy section.
 */
const TermSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element => (
  <div className="space-y-2">
    <h2 className="text-2xl font-semibold">{title}</h2>
    {/*
      The `prose` classes automatically style the raw HTML elements within the children,
      ensuring consistent and readable typography for the legal text.
    */}
    <div className="prose prose-lg max-w-none text-foreground/80 dark:prose-invert">
      {children}
    </div>
  </div>
);

/**
 * The main server component for the Terms and Conditions page.
 * It statically renders the legal text for the application.
 *
 * @returns {JSX.Element} The rendered Terms and Conditions page.
 */
// TODO: Convert this page to be dynamic by fetching its content from the SiteContent API
// using a specific key (e.g., 'termsAndConditions'). This would allow administrators
// to update the terms via a CMS without requiring a code deployment.
export default function TermsAndConditionsPage(): JSX.Element {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <Card className="max-w-4xl mx-auto rounded-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl text-center">
              Terms and Conditions
            </CardTitle>
            {/* TODO: The "Last Updated" date is hardcoded. If this page becomes dynamic,
            this date should be populated from the `updatedAt` field of the fetched content object. */}
            <p className="text-center text-muted-foreground pt-2">
              Last Updated: October 26, 2023
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* A disclaimer is included to clarify that this is a template and not legal advice. */}
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 rounded-r-lg">
              <p className="font-bold">Disclaimer:</p>
              <p>
                This is a template document. For a legally binding Terms and
                Conditions for your business, you must consult with a qualified
                legal professional.
              </p>
            </div>

            <TermSection title="1. Agreement to Terms">
              <p>
                By accessing and using the TedBooks website (the "Service"), you
                agree to be bound by these Terms and Conditions ("Terms"). If
                you do not agree with any part of the terms, then you may not
                access the Service.
              </p>
            </TermSection>

            <TermSection title="2. Account Registration">
              <p>
                To access certain features of the Service, such as purchasing
                books, you must register for an account. Account creation is
                handled through the Google authentication service. You agree to:
              </p>
              <ul>
                <li>
                  Maintain the accuracy of your information as provided by
                  Google.
                </li>
                <li>
                  Take responsibility for all activities that occur under your
                  account.
                </li>
                <li>
                  {/* TODO: Centralize the route path '/privacy-policy' in a shared constants file to improve maintainability. */}
                  Acknowledge that your phone number may be collected and stored
                  during the payment process via PayHero, as detailed in our{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </li>
              </ul>
            </TermSection>

            <TermSection title="3. Purchase of Digital Goods">
              <p>
                The Service offers digital books ("Digital Goods") for sale. By
                placing an order, you agree to the following:
              </p>
              <ul>
                <li>
                  <strong>All Sales are Final:</strong> Due to the
                  instant-access nature of Digital Goods, all purchases are
                  final and non-refundable once the transaction is complete.
                </li>
                <li>
                  <strong>Payment:</strong> All payments are processed through
                  our third-party payment provider, PayHero. By making a
                  purchase, you agree to abide by their terms and conditions. We
                  do not store your financial details.
                </li>
                <li>
                  <strong>Pricing and Availability:</strong> All prices are
                  listed in Kenyan Shillings (Ksh). We reserve the right to
                  change prices and availability of any Digital Good at any time
                  without notice.
                </li>
                <li>
                  <strong>Fulfillment:</strong> Upon successful payment
                  confirmation, a downloadable link for your purchased Digital
                  Good will be made available in the "Downloads" section of your
                  account.
                </li>
              </ul>
            </TermSection>

            <TermSection title="4. Intellectual Property Rights">
              <p>
                The Service itself, including its design, code, and original
                content, is the proprietary property of TedBooks. All Digital
                Goods available on the Service are the intellectual property of
                their respective authors and publishers.
              </p>
              <p>
                Your purchase of a Digital Good grants you a limited,
                non-transferable, personal license to download and view the
                content for your personal, non-commercial use only. You may not
                reproduce, distribute, share, resell, or otherwise exploit the
                Digital Goods for any commercial purpose.
              </p>
            </TermSection>

            <TermSection title="5. Prohibited Activities">
              <p>
                You may not use the Service for any purpose other than that for
                which we make it available. Prohibited activities include, but
                are not limited to:
              </p>
              <ul>
                <li>
                  Systematically retrieving data or other content from the
                  Service to create a collection, database, or directory without
                  written permission from us.
                </li>
                <li>
                  Attempting to bypass any measures of the Service designed to
                  prevent or restrict access.
                </li>
                <li>
                  Reselling, distributing, or sharing purchased Digital Goods.
                </li>
                <li>
                  Using the Service in a manner inconsistent with any applicable
                  laws or regulations.
                </li>
              </ul>
            </TermSection>

            <TermSection title="6. Third-Party Services">
              <p>
                The Service integrates with third-party services, including
                Google (for authentication), PayHero (for payments), and Vercel
                (for hosting and file storage). Your use of these services is
                governed by their respective terms and privacy policies. We are
                not responsible for the actions or policies of these third
                parties.
              </p>
            </TermSection>

            <TermSection title="7. Term and Termination">
              <p>
                These Terms shall remain in full force and effect while you use
                the Service. We reserve the right to, in our sole discretion and
                without notice or liability, deny access to and use of the
                Service to any person for any reason, including for breach of
                these Terms.
              </p>
            </TermSection>

            <TermSection title="8. Disclaimer of Warranties">
              <p>
                The Service is provided on an "as-is" and "as-available" basis.
                You agree that your use of the Service will be at your sole
                risk. To the fullest extent permitted by law, we disclaim all
                warranties, express or implied, in connection with the Service
                and your use thereof.
              </p>
            </TermSection>

            <TermSection title="9. Limitation of Liability">
              <p>
                In no event will we or our directors, employees, or agents be
                liable to you or any third party for any direct, indirect,
                consequential, exemplary, incidental, special, or punitive
                damages arising from your use of the Service.
              </p>
            </TermSection>

            <TermSection title="10. Contact Us">
              <p>
                To resolve a complaint regarding the Service or to receive
                further information regarding use of the Service, please contact
                us at:
              </p>
              <p>
                {/* TODO: The contact email is hardcoded. This should be an environment
                variable or a value fetched from the SiteContent API to be easily configurable. */}
                <strong>support@tedbooks.example.com</strong>
              </p>
            </TermSection>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
