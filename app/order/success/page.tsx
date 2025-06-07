import { Suspense } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { OrderSuccessContent } from "@/components/order/OrderSuccessContent";
import { Loader2 } from "lucide-react";

// This is a server component that renders the layout and a Suspense boundary.
export default function OrderSuccessPage() {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <OrderSuccessContent />
      </Suspense>
    </MainLayout>
  );
}

function LoadingSpinner() {
  return (
    <div className="container mx-auto flex justify-center items-center py-20">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
