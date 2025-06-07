/**
 * @file This file defines the static Privacy Policy page for the application.
 * It outlines how user data is collected, used, and protected.
 */

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JSX } from "react";

/**
 * A reusable helper component to structure sections within a policy or content page.
 * It provides a consistent heading and styling for the enclosed content.
 *
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the policy section.
 * @param {React.ReactNode} props.children - The content of the section.
 * @returns {JSX.Element} The rendered policy section.
 */
const PolicySection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element => (
  <div className="space-y-2">
    <h2 className="text-2xl font-semibold">{title}</h2>
    {/*
      The `prose` classes from @tailwindcss/typography are used here to automatically
      apply beautiful and readable styling to the raw HTML elements (p, ul, li, etc.)
      within the children, avoiding the need for manual styling of content.
    */}
    <div className="prose prose-lg max-w-none text-foreground/80 dark:prose-invert">
      {children}
    </div>
  </div>
);

/**
 * The main server component for the Privacy Policy page.
 * It statically renders the legal text for the application.
 *
 * @returns {JSX.Element} The rendered Privacy Policy page.
 */
// TODO: Convert this page to be dynamic. The content should be fetched from the SiteContent API
// using a specific key (e.g., 'privacyPolicy'). This would allow administrators to update
// the policy via a CMS without requiring a code deployment.
export default function PrivacyPolicyPage(): JSX.Element {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <Card className="max-w-4xl mx-auto rounded-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl text-center">
              Privacy Policy
            </CardTitle>
            {/* TODO: The "Last Updated" date is hardcoded. If this page becomes dynamic,
            this date should be populated from the `updatedAt` field of the fetched content object. */}
            <p className="text-center text-muted-foreground pt-2">
              Last Updated: 7th June, 2023
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <PolicySection title="Introduction">
              <p>
                Welcome to TedBooks ("we," "our," or "us"). We are committed to
                protecting your privacy. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you
                use our website.
              </p>
            </PolicySection>

            <PolicySection title="1. Information We Collect">
              <p>
                We collect information about you in a variety of ways to provide
                and improve our services.
              </p>
              <h3>1.1 Information Collected via Third-Party Services</h3>
              <p>
                We rely on trusted third-party services to create your account
                and process payments. We do not directly collect sensitive
                information on our website.
              </p>
              <ul>
                <li>
                  <strong>Authentication (via Google):</strong> When you sign up
                  or log in using your Google account, we receive your{" "}
                  <strong>name, email address, and profile image</strong> from
                  Google to create and manage your TedBooks account.
                </li>
                <li>
                  <strong>Payments (via PayHero):</strong> When you complete a
                  purchase, our payment processor, PayHero, handles the
                  transaction. Upon successful payment, PayHero provides us with
                  a{" "}
                  <strong>
                    payment confirmation, your phone number, and the name
                  </strong>{" "}
                  associated with the payment. We use this to update your order
                  status and, if not already present, add your phone number to
                  your user profile for communication purposes. We do not
                  receive or store your credit card or M-Pesa PIN.
                </li>
              </ul>
              <h3>1.2 Information Collected Automatically</h3>
              <ul>
                <li>
                  <strong>Cookies:</strong> We use essential cookies to manage
                  your authentication session. These cookies are necessary for
                  the website to function correctly, for example, to keep you
                  logged in.
                </li>
                <li>
                  <strong>Local Storage:</strong> If you are browsing as a
                  guest, we use your browser's local storage to save your
                  shopping cart contents. This data is stored only on your
                  device and is not transmitted to our servers until you log in
                  and your cart is merged with your account.
                </li>
              </ul>
            </PolicySection>

            <PolicySection title="2. How We Use Your Information">
              <p>
                We use the information we collect for the following purposes:
              </p>
              <ul>
                <li>
                  <strong>To Create and Manage Your Account:</strong> To set up
                  your user profile and provide you with access to your account
                  area.
                </li>
                <li>
                  <strong>To Process Transactions and Fulfill Orders:</strong>{" "}
                  To process your payments, create and manage your orders, and
                  provide you with access to your purchased digital content
                  (downloads).
                </li>
                <li>
                  <strong>To Communicate with You:</strong> To send you order
                  confirmations, updates on your order status, and respond to
                  customer service inquiries.
                </li>
                <li>
                  <strong>To Improve Our Services:</strong> To understand how
                  users interact with our website and make improvements to the
                  user experience.
                </li>
              </ul>
            </PolicySection>

            <PolicySection title="3. How We Share Your Information">
              <p>
                We do not sell your personal information. We only share it with
                the following third-party service providers as necessary to run
                our business:
              </p>
              <ul>
                <li>
                  <strong>Google LLC:</strong> As our authentication provider.
                </li>
                <li>
                  <strong>PayHero:</strong> As our payment processor. We share
                  your order total and a unique order reference with them to
                  initiate a transaction.
                </li>
                <li>
                  <strong>Vercel, Inc.:</strong> As our hosting platform. Vercel
                  also provides the Vercel Blob service where we securely store
                  uploaded files, such as book covers and downloadable book
                  files (e.g., PDFs, EPUBs).
                </li>
              </ul>
            </PolicySection>

            <PolicySection title="4. Your Data Rights">
              <p>
                You have certain rights regarding your personal information:
              </p>
              <ul>
                <li>
                  <strong>Access and Update:</strong> You can access and view
                  your personal information (name, email, phone) and your order
                  history at any time on your "My Account" page.
                </li>
                <li>
                  <strong>Deletion:</strong> If you wish to delete your account
                  and associated data, please contact us. Note that we may be
                  required to retain certain information for legal or financial
                  record-keeping purposes.
                </li>
              </ul>
            </PolicySection>

            <PolicySection title="5. Data Security">
              <p>
                We implement administrative, technical, and physical security
                measures to help protect your personal information. While we
                have taken reasonable steps to secure the personal information
                you provide to us, please be aware that despite our efforts, no
                security measures are perfect or impenetrable.
              </p>
            </PolicySection>

            <PolicySection title="6. Changes to This Privacy Policy">
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last Updated" date.
              </p>
            </PolicySection>

            <PolicySection title="7. Contact Us">
              <p>
                If you have any questions or concerns about this Privacy Policy,
                please contact us at:
              </p>
              <p>
                {/* TODO: The contact email is hardcoded. This should be an environment
                variable or a value fetched from the SiteContent API to be easily configurable. */}
                <strong>support@tedbooks.example.com</strong>
              </p>
            </PolicySection>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
