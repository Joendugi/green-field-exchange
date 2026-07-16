import { supabase } from "./client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type WalletTransaction = {
  id: string;
  wallet_id: string;
  user_id: string;
  type: 'topup' | 'order_payment' | 'escrow_hold' | 'escrow_release' | 'escrow_refund' | 'withdrawal' | 'bonus' | 'fee';
  amount: number;
  direction: 'credit' | 'debit';
  reference_id: string | null;
  description: string;
  tx_hash: string | null;
  status: 'pending' | 'completed' | 'failed';
  currency: 'KES' | 'cKES' | 'USD';
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance_kes: number;
  balance_ckes: number;
  wallet_address: string | null;
  is_blockchain_linked: boolean;
  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────
// Get current user's wallet
// ─────────────────────────────────────────────
export async function getMyWallet(): Promise<Wallet> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) throw error;
  
  if (!data) {
    // Auto-create wallet if it doesn't exist yet
    return createWallet(userData.user.id);
  }

  return data;
}

// ─────────────────────────────────────────────
// Create wallet for user (called if missing)
// ─────────────────────────────────────────────
async function createWallet(userId: string): Promise<Wallet> {
  const { data, error } = await supabase
    .from("wallets")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// Get wallet transaction history
// ─────────────────────────────────────────────
export async function getWalletTransactions(limit = 20): Promise<WalletTransaction[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ─────────────────────────────────────────────
// Top-up wallet (simulated — real flow calls M-Pesa API)
// ─────────────────────────────────────────────
export async function topUpWallet({
  amount,
  method,
  referenceCode,
}: {
  amount: number;
  method: "mpesa" | "bank" | "card";
  referenceCode: string;
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const wallet = await getMyWallet();

  // 1. Credit the wallet balance
  const { error: balanceError } = await supabase
    .from("wallets")
    .update({ balance_kes: wallet.balance_kes + amount })
    .eq("id", wallet.id);

  if (balanceError) throw balanceError;

  // 2. Record the transaction in the ledger
  const { error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      user_id: userData.user.id,
      type: "topup",
      amount,
      direction: "credit",
      reference_id: referenceCode,
      description: `Wallet top-up via ${method === "mpesa" ? "M-Pesa" : method === "bank" ? "Bank Transfer" : "Card"}`,
      status: "completed",
      currency: "KES",
    });

  if (txError) throw txError;
}

// ─────────────────────────────────────────────
// Pay for an order using wallet balance (escrow lock)
// ─────────────────────────────────────────────
export async function payOrderWithWallet(orderId: string, amount: number): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const wallet = await getMyWallet();

  if (wallet.balance_kes < amount) {
    throw new Error(`Insufficient wallet balance. You have KSh ${wallet.balance_kes.toLocaleString()} but the order total is KSh ${amount.toLocaleString()}.`);
  }

  // 1. Debit wallet (lock funds in escrow)
  const { error: balanceError } = await supabase
    .from("wallets")
    .update({ balance_kes: wallet.balance_kes - amount })
    .eq("id", wallet.id);

  if (balanceError) throw balanceError;

  // 2. Lock order escrow status to 'held'
  const { error: orderError } = await supabase
    .from("orders")
    .update({ escrow_status: "held" })
    .eq("id", orderId);

  if (orderError) throw orderError;

  // 3. Record ledger entry
  const { error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      user_id: userData.user.id,
      type: "escrow_hold",
      amount,
      direction: "debit",
      reference_id: orderId,
      description: `Escrow hold for order #${orderId.slice(0, 8).toUpperCase()}`,
      status: "completed",
      currency: "KES",
    });

  if (txError) throw txError;
}

// ─────────────────────────────────────────────
// Withdrawal request
// ─────────────────────────────────────────────
export async function requestWithdrawal({
  amount,
  mpesaNumber,
}: {
  amount: number;
  mpesaNumber: string;
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const wallet = await getMyWallet();

  if (wallet.balance_kes < amount) {
    throw new Error(`Insufficient balance for withdrawal. Available: KSh ${wallet.balance_kes.toLocaleString()}`);
  }

  if (amount < 100) {
    throw new Error("Minimum withdrawal amount is KSh 100.");
  }

  // 1. Debit wallet
  const { error: balanceError } = await supabase
    .from("wallets")
    .update({ balance_kes: wallet.balance_kes - amount })
    .eq("id", wallet.id);

  if (balanceError) throw balanceError;

  // 2. Log pending withdrawal (admin processes payout via M-Pesa API)
  const { error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      user_id: userData.user.id,
      type: "withdrawal",
      amount,
      direction: "debit",
      reference_id: mpesaNumber,
      description: `Withdrawal to M-Pesa ${mpesaNumber}`,
      status: "pending",
      currency: "KES",
    });

  if (txError) throw txError;
}

// ─────────────────────────────────────────────
// Link a Celo blockchain wallet address
// ─────────────────────────────────────────────
export async function linkBlockchainWallet(walletAddress: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("wallets")
    .update({
      wallet_address: walletAddress,
      is_blockchain_linked: true,
    })
    .eq("user_id", userData.user.id);

  if (error) throw error;
}
