import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getMyWallet, getWalletTransactions, type Wallet, type WalletTransaction } from "@/integrations/supabase/wallet";
import { useAuth } from "@/contexts/AuthContext";

// ─────────────────────────────────────────────
// Context Types
// ─────────────────────────────────────────────
type WalletContextType = {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  transactions: [],
  isLoading: false,
  error: null,
  refresh: async () => {},
});

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const [walletData, txData] = await Promise.all([
        getMyWallet(),
        getWalletTransactions(30),
      ]);
      setWallet(walletData);
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [isAuthenticated]);

  return (
    <WalletContext.Provider value={{ wallet, transactions, isLoading, error, refresh: loadWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useWallet() {
  return useContext(WalletContext);
}
