import Navbar from "@/components/Navbar";
import WakulimaWallet from "@/components/WakulimaWallet";
import { WidgetErrorBoundary } from "@/components/WidgetErrorBoundary";

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <WidgetErrorBoundary fallbackMessage="Wallet unavailable">
          <WakulimaWallet />
        </WidgetErrorBoundary>
      </main>
    </div>
  );
}
