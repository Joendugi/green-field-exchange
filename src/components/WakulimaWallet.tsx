import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, RefreshCcw, ShieldCheck,
  Loader2, CheckCircle, Plus, Link2, TrendingUp, History, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { topUpWallet, requestWithdrawal, linkBlockchainWallet } from "@/integrations/supabase/wallet";
import type { WalletTransaction } from "@/integrations/supabase/wallet";

// ─────────────────────────────────────────────
// Transaction type label/icon helpers
// ─────────────────────────────────────────────
const TX_META: Record<string, { label: string; icon: string; color: string }> = {
  topup:         { label: "Wallet Top-Up",       icon: "⬆️",  color: "text-emerald-600" },
  order_payment: { label: "Order Payment",        icon: "🛒",  color: "text-red-500" },
  escrow_hold:   { label: "Escrow Lock",          icon: "🔒",  color: "text-amber-600" },
  escrow_release:{ label: "Escrow Released",      icon: "✅",  color: "text-emerald-600" },
  escrow_refund: { label: "Escrow Refund",        icon: "↩️",  color: "text-blue-600" },
  withdrawal:    { label: "Withdrawal",           icon: "⬇️",  color: "text-orange-600" },
  bonus:         { label: "Platform Bonus",       icon: "🎁",  color: "text-purple-600" },
  fee:           { label: "Platform Fee",         icon: "💸",  color: "text-gray-500" },
};

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const meta = TX_META[tx.type] || { label: tx.type, icon: "•", color: "text-foreground" };
  return (
    <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/40 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg select-none">
          {meta.icon}
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{meta.label}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{tx.description}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            {new Date(tx.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm ${tx.direction === "credit" ? "text-emerald-600" : "text-red-500"}`}>
          {tx.direction === "credit" ? "+" : "−"} KSh {tx.amount.toLocaleString()}
        </p>
        <Badge
          variant={tx.status === "completed" ? "secondary" : tx.status === "pending" ? "outline" : "destructive"}
          className="text-[9px] h-4 px-1.5 mt-1"
        >
          {tx.status}
        </Badge>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Wallet Component
// ─────────────────────────────────────────────
export default function WakulimaWallet() {
  const { wallet, transactions, isLoading, error, refresh } = useWallet();

  // Top-Up dialog
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpMethod, setTopUpMethod] = useState<"mpesa" | "bank" | "card">("mpesa");
  const [topUpRef, setTopUpRef] = useState("");
  const [topUpPhone, setTopUpPhone] = useState("");
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [topUpStep, setTopUpStep] = useState<"input" | "confirm" | "success">("input");

  // Withdraw dialog
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  // Blockchain link dialog
  const [showBlockchain, setShowBlockchain] = useState(false);
  const [celoAddress, setCeloAddress] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // ─── Top-Up Handler ───────────────────────
  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount < 10) {
      toast.error("Minimum top-up is KSh 10."); return;
    }

    if (topUpMethod === "mpesa" && topUpStep === "input") {
      if (!topUpPhone || topUpPhone.length < 9) {
        toast.error("Enter a valid Safaricom number."); return;
      }
      setTopUpStep("confirm");
      return;
    }

    if (topUpMethod !== "mpesa" && !topUpRef) {
      toast.error("Please enter the transaction reference."); return;
    }

    setIsProcessingTopUp(true);
    try {
      await new Promise(r => setTimeout(r, 2000)); // simulate gateway
      await topUpWallet({
        amount,
        method: topUpMethod,
        referenceCode: topUpMethod === "mpesa" ? `MPESA-${topUpPhone}` : topUpRef,
      });
      setTopUpStep("success");
      await refresh();
      toast.success(`KSh ${amount.toLocaleString()} added to your wallet!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessingTopUp(false);
    }
  };

  // ─── Withdrawal Handler ──────────────────
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 100) {
      toast.error("Minimum withdrawal is KSh 100."); return;
    }
    if (!withdrawPhone || withdrawPhone.length < 9) {
      toast.error("Enter a valid M-Pesa number."); return;
    }
    setIsProcessingWithdraw(true);
    try {
      await requestWithdrawal({ amount, mpesaNumber: `+254${withdrawPhone}` });
      await refresh();
      setShowWithdraw(false);
      setWithdrawAmount("");
      setWithdrawPhone("");
      toast.success(`Withdrawal of KSh ${amount.toLocaleString()} submitted. Funds arrive in 1-5 minutes.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  // ─── Blockchain Link Handler ─────────────
  const handleLinkBlockchain = async () => {
    if (!celoAddress.startsWith("0x") || celoAddress.length !== 42) {
      toast.error("Please enter a valid Celo/EVM wallet address (0x…)."); return;
    }
    setIsLinking(true);
    try {
      await linkBlockchainWallet(celoAddress);
      await refresh();
      setShowBlockchain(false);
      toast.success("Celo wallet linked successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLinking(false);
    }
  };

  // ─── Loading ─────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive flex flex-col items-center gap-3">
        <AlertCircle className="h-8 w-8" />
        <p className="font-semibold">Could not load wallet: {error}</p>
        <Button variant="outline" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const balance = wallet?.balance_kes ?? 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ── Balance Card ─────────────────────────── */}
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <CardContent className="pt-8 pb-7 relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Wakulima Wallet</p>
              <div className="mt-2 text-4xl font-black tracking-tight">
                KSh {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-white/60 text-xs mt-1">
                ≈ cKES {wallet?.balance_ckes?.toFixed(4) ?? "0.0000"} on Celo
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-full p-3">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {wallet?.is_blockchain_linked ? (
              <Badge className="bg-white/20 text-white border-white/30 text-xs gap-1.5">
                <Link2 className="h-3 w-3" /> Celo Linked: {wallet.wallet_address?.slice(0, 6)}…{wallet.wallet_address?.slice(-4)}
              </Badge>
            ) : (
              <Badge className="bg-white/10 text-white/70 border-white/20 text-xs gap-1.5 cursor-pointer hover:bg-white/20 transition" onClick={() => setShowBlockchain(true)}>
                <Link2 className="h-3 w-3" /> Link Blockchain Wallet
              </Badge>
            )}
            <Badge className="bg-emerald-500/40 text-white border-emerald-300/30 text-xs gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Escrow Protected
            </Badge>
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-white/60 text-[10px] uppercase">Deposits</p>
              <p className="font-bold text-sm">
                KSh {transactions.filter(t => t.direction === "credit" && t.type === "topup").reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-white/60 text-[10px] uppercase">Spent</p>
              <p className="font-bold text-sm">
                KSh {transactions.filter(t => t.direction === "debit").reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-white/60 text-[10px] uppercase">Tx Count</p>
              <p className="font-bold text-sm">{transactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ──────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          className="flex-col h-20 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow font-bold"
          onClick={() => { setTopUpStep("input"); setShowTopUp(true); }}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs">Top Up</span>
        </Button>
        <Button
          variant="outline"
          className="flex-col h-20 gap-2 border-2 font-bold"
          onClick={() => setShowWithdraw(true)}
          disabled={balance < 100}
        >
          <ArrowUpRight className="h-5 w-5" />
          <span className="text-xs">Withdraw</span>
        </Button>
        <Button
          variant="outline"
          className="flex-col h-20 gap-2 border-2 font-bold"
          onClick={refresh}
        >
          <RefreshCcw className="h-5 w-5" />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>

      {/* ── Transaction History ───────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Transaction History</CardTitle>
          </div>
          <CardDescription>Your last {transactions.length} wallet movements</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions yet. Top up your wallet to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {transactions.map(tx => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════ Top-Up Dialog ════════════════════════ */}
      <Dialog open={showTopUp} onOpenChange={(open) => { if (!open) { setShowTopUp(false); setTopUpStep("input"); setTopUpAmount(""); setTopUpRef(""); setTopUpPhone(""); }}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Plus className="h-5 w-5" /> Add Money to Wallet
            </DialogTitle>
            <DialogDescription>Funds are secured and available instantly after confirmation.</DialogDescription>
          </DialogHeader>

          {topUpStep === "success" ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto" />
              <h3 className="font-black text-xl text-emerald-700">Funds Added!</h3>
              <p className="text-muted-foreground text-sm">KSh {parseFloat(topUpAmount).toLocaleString()} has been credited to your Wakulima Wallet.</p>
              <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setShowTopUp(false); setTopUpStep("input"); setTopUpAmount(""); }}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Amount (KSh)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="mt-1 text-lg font-bold"
                  min={10}
                />
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setTopUpAmount(String(amt))}
                      className="text-xs border border-border rounded-full px-3 py-1 hover:bg-primary hover:text-white hover:border-primary transition-colors font-medium"
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Payment Method</Label>
                <Select value={topUpMethod} onValueChange={(v) => setTopUpMethod(v as any)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">📱 M-Pesa (Safaricom STK Push)</SelectItem>
                    <SelectItem value="bank">🏦 Bank Transfer (Equity / KCB)</SelectItem>
                    <SelectItem value="card">💳 Debit / Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {topUpMethod === "mpesa" && topUpStep === "input" && (
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Safaricom Phone Number</Label>
                  <div className="flex gap-2 mt-1">
                    <span className="h-10 border border-input rounded-md px-3 py-2 text-sm bg-muted font-semibold flex items-center">+254</span>
                    <Input
                      placeholder="712345678"
                      value={topUpPhone}
                      onChange={(e) => setTopUpPhone(e.target.value.replace(/\D/g, ""))}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {topUpMethod === "mpesa" && topUpStep === "confirm" && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-bold">📱 M-Pesa STK Push Sent</p>
                  <p className="text-xs">Check your phone (+254 {topUpPhone}) for a PIN prompt to deposit <strong>KSh {parseFloat(topUpAmount).toLocaleString()}</strong>.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-400 text-emerald-700 mt-1"
                    onClick={() => setTopUpStep("input")}
                  >
                    Change Number
                  </Button>
                </div>
              )}

              {topUpMethod !== "mpesa" && (
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Transaction Reference</Label>
                  {topUpMethod === "bank" && (
                    <div className="p-3 mt-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1 mb-2">
                      <p className="font-bold">🏦 Wakulima Wallet Deposit Account</p>
                      <p><strong>Bank:</strong> Equity Bank Kenya | Paybill: <strong>247247</strong></p>
                      <p><strong>Account:</strong> WAK-WALLET</p>
                    </div>
                  )}
                  <Input
                    placeholder="Paste transaction reference code"
                    value={topUpRef}
                    onChange={(e) => setTopUpRef(e.target.value.toUpperCase())}
                    className="mt-1"
                  />
                </div>
              )}

              <Button
                className="w-full h-11 font-bold bg-emerald-600 hover:bg-emerald-700"
                onClick={handleTopUp}
                disabled={isProcessingTopUp}
              >
                {isProcessingTopUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {topUpMethod === "mpesa" && topUpStep === "input" ? "Send M-Pesa STK Push" :
                 topUpMethod === "mpesa" && topUpStep === "confirm" ? "Confirm PIN Entered" :
                 "Add Funds to Wallet"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════ Withdrawal Dialog ═══════════════════ */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-orange-600" /> Withdraw Funds
            </DialogTitle>
            <DialogDescription>Withdraw to M-Pesa. Minimum KSh 100. Processing: 1–5 minutes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted rounded-lg flex justify-between text-sm">
              <span className="text-muted-foreground">Available Balance:</span>
              <span className="font-bold text-emerald-600">KSh {balance.toLocaleString()}</span>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Amount to Withdraw (KSh)</Label>
              <Input
                type="number"
                placeholder="Minimum KSh 100"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="mt-1 text-lg font-bold"
                min={100}
                max={balance}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">M-Pesa Phone Number</Label>
              <div className="flex gap-2 mt-1">
                <span className="h-10 border border-input rounded-md px-3 py-2 text-sm bg-muted font-semibold flex items-center">+254</span>
                <Input
                  placeholder="712345678"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1"
                />
              </div>
            </div>
            <Button
              className="w-full h-11 font-bold bg-orange-600 hover:bg-orange-700"
              onClick={handleWithdraw}
              disabled={isProcessingWithdraw}
            >
              {isProcessingWithdraw ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
              Withdraw to M-Pesa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ Blockchain Link Dialog ══════════════ */}
      <Dialog open={showBlockchain} onOpenChange={setShowBlockchain}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" /> Link Celo Blockchain Wallet
            </DialogTitle>
            <DialogDescription>
              Connect a Celo-compatible wallet (MetaMask, Valora, etc.) to enable on-chain stablecoin payments and earn cKES rewards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs space-y-2">
              <p className="font-bold">✨ Benefits of Blockchain Linking</p>
              <ul className="space-y-1 text-muted-foreground pl-2">
                <li>• Pay with <strong>cKES</strong> (Celo Kenyan Shilling stablecoin)</li>
                <li>• Instant, irreversible escrow via smart contract</li>
                <li>• Cross-border payments without forex fees</li>
                <li>• Earn on-chain loyalty points for every transaction</li>
              </ul>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Your Celo Wallet Address</Label>
              <Input
                placeholder="0x1234...abcd (42 characters)"
                value={celoAddress}
                onChange={(e) => setCeloAddress(e.target.value.trim())}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Copy this from Valora App, MetaMask (switched to Celo network), or any EVM-compatible wallet.
              </p>
            </div>
            <Separator />
            <Button
              className="w-full h-11 font-bold"
              onClick={handleLinkBlockchain}
              disabled={isLinking}
            >
              {isLinking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
              Link Wallet Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
