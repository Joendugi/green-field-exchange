import Navbar from "@/components/Navbar";
import WakulimaWallet from "@/components/WakulimaWallet";

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <WakulimaWallet />
      </main>
    </div>
  );
}
