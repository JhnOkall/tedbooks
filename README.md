# TedBooks - A Full-Stack E-commerce Bookstore

TedBooks is a modern, full-stack e-commerce application designed for selling digital books. Built with the Next.js App Router, it features a complete user authentication system, a powerful admin dashboard for managing content, and a seamless payment integration with PayHero.

![TedBooks Screenshot (Conceptual)](https://75rfypg2otkow6jl.public.blob.vercel-storage.com/Screenshot%202025-06-07%20154800-QlM51gxoVZrvCvPg3fcI3wgB1pkegA.png)

## Features

### 👤 User-Facing Features

- **Google Authentication:** Secure and easy sign-in/sign-up using NextAuth.js.
- **Book Catalog:** Browse and search for books by title or author.
- **Featured Books Section:** A dedicated section on the homepage for highlighted books.
- **Hybrid Shopping Cart:**
  - For guests, the cart is saved in `localStorage`.
  - For authenticated users, the cart is synced and persisted in the database.
  - Automatically merges the guest cart with the user's account upon login.
- **Dynamic Content Pages:** "About Us," "Privacy Policy," and "Terms" pages with content managed from the admin panel.
- **Secure Checkout:**
  - "Create-Then-Pay" flow: An order is first created with a `Pending` status.
  - Integration with the **PayHero Payment Button SDK** for handling payments.
  - Webhook support for server-to-server payment confirmation.
- **User Account Dashboard:**
  - View and edit profile information.
  - Access order history.
  - Download purchased digital books.

### 👑 Admin Panel Features

- **Role-Based Access Control (RBAC):** The entire `/admin` route is protected and accessible only to users with an "admin" role.
- **Comprehensive Dashboard:**
  - At-a-glance statistics from the internal database (total books, revenue, users, etc.).
  - Real-time wallet balances fetched securely from the **PayHero API**.
  - Service wallet top-up functionality via M-Pesa STK push.
  - A table of recent PayHero transactions.
- **Book Management (CRUD):**
  - Add, view, edit, and delete books.
  - **Signed Direct Uploads:** Upload book covers and digital book files (PDFs, EPUBs) directly to **Cloudinary**, bypassing server payload limits.
- **Order Management:** View all customer orders and update their status (e.g., from 'Pending' to 'Completed').
- **Site Content Management:** Dynamically edit the content of static pages like "About Us" without needing to redeploy.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS with shadcn/ui
- **Database:** MongoDB with Mongoose
- **Authentication:** NextAuth.js (Auth.js v5) with Google Provider
- **File Storage:** **Cloudinary** (for robust, scalable file storage)
- **Payments:** PayHero (Button SDK & Server-side API)
- **State Management:** React Context API (`useContext`) for cart state
- **UI/UX:** Framer Motion for animations, `sonner` for toast notifications

## Prerequisites

Before you begin, ensure you have the following set up:

- [Node.js](https://nodejs.org/) (v18 or later)
- `npm`, `yarn`, or `pnpm`
- A MongoDB database instance (e.g., a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- A Google Cloud project with OAuth 2.0 credentials enabled.
- A **[Cloudinary](https://cloudinary.com/)** account with API credentials.
- A [PayHero](https://payhero.co.ke/) account with API credentials and a Lipwa link.

## Getting Started

Follow these steps to get your local development environment running.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/tedbooks.git
cd tedbooks
```

### 2. Install Dependencies

You will need the `cloudinary` package for this setup.

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project by copying the example below. Fill in the values with your own credentials.

```env
# .env.local

# Authentication (generate with `npx auth secret`)
AUTH_SECRET='your_auth_secret_here'

# Google OAuth Credentials
AUTH_GOOGLE_ID='your_google_client_id'
AUTH_GOOGLE_SECRET='your_google_client_secret'

# Base URL (for server-side API calls)
NEXT_PUBLIC_BASE_URL='http://localhost:3000'

# MongoDB Connection String
MONGODB_URI='your_mongodb_connection_string'

# Cloudinary Credentials (for signed uploads)
CLOUDINARY_CLOUD_NAME='your_cloudinary_cloud_name'
CLOUDINARY_API_KEY='your_cloudinary_api_key'
CLOUDINARY_API_SECRET='your_cloudinary_api_secret'

# PayHero API Credentials (for server-side calls)
PAYHERO_API_USERNAME='your_payhero_api_username'
PAYHERO_API_PASSWORD='your_payhero_api_password'
PAYHERO_WALLET_CHANNEL_ID='your_payhero_wallet_channel_id'

# PayHero SDK Configuration (for client-side button)
NEXT_PUBLIC_PAYHERO_LIPWA_URL='your_payhero_lipwa_url'
NEXT_PUBLIC_PAYHERO_CHANNEL_ID='your_payhero_sdk_channel_id'
```

> **Note:** To get the `AUTH_SECRET`, run `npx auth secret` in your terminal. For production, `NEXT_PUBLIC_BASE_URL` should be your public domain (e.g., `https://www.tedbooks.com`).

### 4. Run the Development Server

```bash
npm run dev
```

Your application should now be running at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Creates a production-ready build of the application.
- `npm run start`: Starts the production server.

## Project Structure

```
.
├── app/
│   ├── about/
│   ├── account/
│   ├── book/[id]/
│   ├── admin/                    # Protected admin panel pages
│   │   ├── books/
│   │   ├── content/
│   │   └── ...
│   ├── api/                      # Backend API routes
│   │   ├── admin/
│   │   ├── books/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── upload/               # Generates Cloudinary signatures
│   │   └── webhooks/
│   └── layout.tsx                # Root layout
├── components/
│   ├── admin/
│   │   ├── add-book-form.tsx
│   │   ├── edit-book-form.tsx
│   │   └── file-upload.tsx       # Reusable Cloudinary upload component
│   ├── books/
│   ├── cart/
│   ├── layout/
│   └── ui/                       # shadcn/ui components
├── context/
│   └── CartContext.tsx           # Hybrid cart state management
├── lib/
│   ├── data.ts                   # Centralized data fetching functions
│   ├── db.ts                     # Database connection utility
│   └── upload-utils.ts           # Client-side Cloudinary upload logic
├── models/
│   ├── Book.ts
│   ├── Cart.ts
│   ├── Order.ts
│   ├── SiteContent.ts
│   └── User.ts
├── public/                       # Static assets
└── auth.ts                       # NextAuth.js configuration
```
