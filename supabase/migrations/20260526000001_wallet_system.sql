-- ============================================================
-- Wakulima Wallet System Migration
-- Creates the wallet infrastructure for internal balance tracking
-- ============================================================

-- 1. Wallets table - one per user, tracks their KES and cKES balance
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance_kes numeric(14, 2) DEFAULT 0 NOT NULL,
  balance_ckes numeric(18, 6) DEFAULT 0 NOT NULL,
  wallet_address text DEFAULT NULL,         -- Celo blockchain address (optional)
  is_blockchain_linked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT wallet_balance_positive CHECK (balance_kes >= 0 AND balance_ckes >= 0)
);

-- 2. Wallet transactions ledger - immutable record of all movements
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN (
    'topup',           -- User added money (M-Pesa, bank)
    'order_payment',   -- Paid for an order via wallet
    'escrow_hold',     -- Funds locked in escrow for an order
    'escrow_release',  -- Farmer received payment from escrow
    'escrow_refund',   -- Buyer refunded from disputed escrow
    'withdrawal',      -- User withdrew to M-Pesa / bank
    'bonus',           -- Platform credited bonus/reward
    'fee'              -- Platform fee deduction
  )),
  amount numeric(14, 2) NOT NULL,
  direction text NOT NULL CHECK (direction IN ('credit', 'debit')),
  reference_id text DEFAULT NULL,           -- order_id, topup_ref, etc.
  description text NOT NULL,
  tx_hash text DEFAULT NULL,               -- blockchain tx hash if applicable
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  currency text NOT NULL DEFAULT 'KES' CHECK (currency IN ('KES', 'cKES', 'USD')),
  created_at timestamptz DEFAULT now()
);

-- 3. Auto-create wallet when a new user signs up
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_wallet_on_profile_create ON public.profiles;
CREATE TRIGGER create_wallet_on_profile_create
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_user();

-- 4. Auto-update updated_at on wallet changes
CREATE OR REPLACE FUNCTION public.touch_wallet_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_wallet_timestamp ON public.wallets;
CREATE TRIGGER touch_wallet_timestamp
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.touch_wallet_updated_at();

-- 5. Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own wallet
CREATE POLICY "wallet_owner_select" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallet_owner_update" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only read their own transactions
CREATE POLICY "wallet_txn_owner_select" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins (service role) can insert transactions
CREATE POLICY "wallet_txn_service_insert" ON public.wallet_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "wallet_service_insert" ON public.wallets
  FOR INSERT WITH CHECK (true);

-- Admins can see all wallets
CREATE POLICY "wallet_admin_select" ON public.wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_type ON public.wallet_transactions(type);
