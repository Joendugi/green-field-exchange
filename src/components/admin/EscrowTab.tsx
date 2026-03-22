import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { listDisputedOrders, resolveDispute } from "@/integrations/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, PackageOpen, Undo2, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const EscrowTab = () => {
  const queryClient = useQueryClient();
  const { data: disputedOrders = [], isLoading } = useSupabaseQuery<any[]>(
    ["admin", "disputedOrders"],
    listDisputedOrders
  );

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [resolutionType, setResolutionType] = useState<"refund" | "release" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResolve = async () => {
    if (!selectedOrder || !resolutionType) return;
    
    setIsProcessing(true);
    const loadingToast = toast.loading(`Processing ${resolutionType}...`);
    try {
      await resolveDispute({ 
        orderId: selectedOrder.id, 
        resolution: resolutionType 
      });
      
      toast.dismiss(loadingToast);
      toast.success(
        resolutionType === "refund" 
          ? "Buyer has been refunded and order cancelled." 
          : "Funds released to the farmer."
      );
      
      // Invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: ["admin", "disputedOrders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      
      setSelectedOrder(null);
      setResolutionType(null);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (disputedOrders.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 border rounded-lg">
        <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">No Disputed Orders</h3>
        <p className="text-sm text-muted-foreground">All escrow transactions are flowing smoothly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-semibold text-destructive">Admin Attention Required</h4>
          <p className="text-sm text-destructive/80">
            These orders have been disputed by the buyer while the funds are held in escrow. 
            Review the situation offline or via logs, then make a ruling to release or refund the funds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {disputedOrders.map((order: any) => (
          <Card key={order.id} className="border-destructive/30 border-2 overflow-hidden flex flex-col">
            <CardHeader className="pb-3 bg-destructive/5">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-base md:text-lg font-bold truncate leading-tight">
                    {order.product?.name || "Unknown Product"}
                </CardTitle>
                <Badge variant="destructive" className="shrink-0 text-[10px] uppercase tracking-wider">Disputed</Badge>
              </div>
              <CardDescription className="font-medium">
                Escrow: <span className="text-emerald-600 font-bold">${order.total_price}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm p-4 pt-5 flex-1 flex flex-col">
              <div className="bg-muted/50 p-3 rounded-lg space-y-2.5 border border-border/40">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Buyer:</span>
                  <span className="font-semibold">{order.buyer?.full_name || "Unknown"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Farmer:</span>
                  <span className="font-semibold">{order.farmer?.full_name || "Unknown"}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">Order ID:</span>
                  <span className="text-xs font-mono">#{order.id.slice(0, 8)}</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10" 
                  onClick={() => { setSelectedOrder(order); setResolutionType("release"); }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Release
                </Button>
                <Button 
                  className="flex-1 h-10" 
                  variant="destructive"
                  onClick={() => { setSelectedOrder(order); setResolutionType("refund"); }}
                >
                  <Undo2 className="mr-2 h-4 w-4" /> Refund
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && !isProcessing && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {resolutionType === "refund" ? "Refund to Buyer" : "Release to Farmer"}</DialogTitle>
            <DialogDescription>
              {resolutionType === "refund" 
                ? "This will cancel the order, refund the escrow funds back to the buyer, and notify both parties. This action cannot be undone."
                : "This will complete the order, release the escrow funds to the farmer, and notify both parties. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedOrder(null)} disabled={isProcessing}>Cancel</Button>
            <Button 
              variant={resolutionType === "refund" ? "destructive" : "default"}
              className={resolutionType === "release" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={handleResolve}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {resolutionType === "refund" ? "Refund" : "Release"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

