import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, CheckCircle, XCircle, MessageSquare, Clock3, ShieldCheck, Star, Undo2, DollarSign, AlertCircle, CreditCard, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getMyOrders, updateOrderStatus, payOrder, releasePayment, disputeOrder } from "@/integrations/supabase/orders";
import { submitReview } from "@/integrations/supabase/reviews";
import { startConversation } from "@/integrations/supabase/messages";
import { useQueryClient } from "@tanstack/react-query";

interface MyOrdersProps {
  userRole?: string | null;
}

const MyOrders = ({ userRole: propRole }: MyOrdersProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: maybeOrders, isLoading } = useSupabaseQuery<any[]>(
    ["orders", user?.id || ""],
    () => getMyOrders(),
    { enabled: !!user }
  );

  const orders = (maybeOrders || []) as any[];

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [bankRef, setBankRef] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState("input");
  
  const [targetDisputeOrder, setTargetDisputeOrder] = useState<any>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    filteredOrders.forEach(order => {
      next[order.id] = true;
    });
    setExpandedOrders(next);
  };

  const handleCollapseAll = () => {
    setExpandedOrders({});
  };

  const handleMessage = async (order: any) => {
    // Determine the other party's user_id
    const myId = user?.id;
    // farmer_id and buyer_id on an order are the raw UUIDs
    const isSeller = order.farmer_id === myId || order.farmer_id?.user_id === myId;
    const otherUserId = isSeller
      ? (typeof order.buyer_id === "string" ? order.buyer_id : order.buyer_id?.user_id)
      : (typeof order.farmer_id === "string" ? order.farmer_id : order.farmer_id?.user_id);

    if (!otherUserId) {
      toast.error("Could not identify the other party for this order.");
      return;
    }

    const loadingToast = toast.loading("Opening conversation...");
    try {
      await startConversation(otherUserId);
      toast.dismiss(loadingToast);
      // Navigate to messages page with ?with= so Messages component auto-opens the thread
      navigate(`/messages?with=${otherUserId}`);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error("Failed to open conversation: " + err.message);
    }
  };

  const handleReleasePayment = async (orderId: string) => {
    try {
      if (!window.confirm("Confirm that you have received the items? This will release the funds to the farmer.")) return;
      await releasePayment(orderId);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Payment released to the farmer!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePayOrder = async () => {
    if (!paymentOrder) return;
    
    if (paymentOrder.payment_type === "mobile_money" && paymentStep === "input") {
      if (!mpesaPhone || mpesaPhone.length < 9) {
        toast.error("Please enter a valid Safaricom phone number.");
        return;
      }
      setPaymentStep("prompt");
      setIsProcessingPayment(true);
      return;
    }

    if (paymentOrder.payment_type === "bank_transfer") {
      if (!bankRef || bankRef.length < 5) {
        toast.error("Please enter the bank transaction reference code.");
        return;
      }
    }

    setIsProcessingPayment(true);
    const loadingToast = toast.loading("Confirming transaction with Wakulima Escrow...");
    try {
      await new Promise(r => setTimeout(r, 2500));
      await payOrder(paymentOrder.id);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.dismiss(loadingToast);
      toast.success("Payment successful! Funds are now securely held in Escrow.");
      setIsPaymentModalOpen(false);
      setPaymentOrder(null);
      setPaymentStep("input");
      setMpesaPhone("");
      setBankRef("");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDisputeOrder = async () => {
    if (!targetDisputeOrder || !disputeReason) {
      toast.error("Please provide a reason for the dispute.");
      return;
    }
    const loadingToast = toast.loading("Filing dispute...");
    try {
      await disputeOrder(targetDisputeOrder.id, disputeReason);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.dismiss(loadingToast);
      toast.success("Dispute filed successfully. An admin will review your case.");
      setIsDisputeModalOpen(false);
      setTargetDisputeOrder(null);
      setDisputeReason("");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    try {
      await submitReview({
        order_id: reviewOrder.id,
        farmer_id: reviewOrder.farmer_id,
        rating,
        comment,
      });
      toast.success("Review submitted! Thank you.");
      setIsReviewModalOpen(false);
      setReviewOrder(null);
      setRating(5);
      setComment("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredOrders = useMemo(() => {
    const ordersArray = (maybeOrders || []) as any[];
    return ordersArray.filter((order: any) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch = searchTerm
        ? [order.products?.name, order.buyer_id?.full_name, order.farmer_id?.full_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const orderDate = new Date(order.created_at).toISOString().split("T")[0];
      const matchesStart = startDate ? orderDate >= startDate : true;
      const matchesEnd = endDate ? orderDate <= endDate : true;
      return matchesStatus && matchesSearch && matchesStart && matchesEnd;
    });
  }, [maybeOrders, statusFilter, searchTerm, startDate, endDate]);

  const timelineSteps = [
    { key: "pending", label: "Order Placed" },
    { key: "accepted", label: "Accepted" },
    { key: "dispatched", label: "Dispatched" },
    { key: "completed", label: "Completed" },
  ];

  const renderTimeline = (order: any) => {
    const currentIndex = order.status === "cancelled"
      ? -1
      : timelineSteps.findIndex((step) => step.key === order.status);

    return (
      <div className="py-4 px-2 bg-muted/30 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          <Clock3 className="h-4 w-4 text-primary" />
          Order Progress Tracking
        </div>
        <div className="relative flex justify-between items-center sm:px-4">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-muted z-0 hidden sm:block" />
          <div
            className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 z-0 hidden sm:block"
            style={{ width: `${Math.max(0, currentIndex) * (100 / (timelineSteps.length - 1))}%` }}
          />

          {timelineSteps.map((step, index) => {
            const isActive = currentIndex >= index;
            const isCurrent = currentIndex === index;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5 group flex-1">
                <div
                  className={`h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold transition-all duration-300 border-2 ${isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-background text-muted-foreground"
                    } ${isCurrent ? "scale-110 shadow-lg shadow-primary/20" : ""}`}
                >
                  {isActive ? <CheckCircle className="h-4 w-4 md:h-5 md:w-5" /> : index + 1}
                </div>
                <div className="text-center px-0.5">
                  <p className={`text-[9px] md:text-xs font-bold leading-tight transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Order ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status: " + error.message);
    }
  };

  const getStatusBadge = (order: any) => {
    const status = order.status;
    const escrow = order.escrow_status;

    if (escrow === "awaiting_payment") {
      return <Badge variant="outline" className="text-amber-600 border-amber-600"><Clock3 className="mr-1 h-3 w-3" /> Awaiting Payment</Badge>;
    }
    if (escrow === "held") {
      return <Badge className="bg-blue-500 hover:bg-blue-600"><ShieldCheck className="mr-1 h-3 w-3" /> Payment Held</Badge>;
    }
    if (escrow === "released") {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
    }
    if (escrow === "refunded") {
      return <Badge variant="destructive"><Undo2 className="mr-1 h-3 w-3" /> Refunded</Badge>;
    }
    if (escrow === "disputed") {
      return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> Disputed</Badge>;
    }

    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      accepted: "default",
      completed: "outline",
      cancelled: "destructive",
    };

    return <Badge variant={variants[status] || "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">
          My Orders & Sales
        </h2>
        <p className="text-sm text-muted-foreground">
          Track every order with filters, timelines, and instant messaging.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="text-sm text-muted-foreground">Search</Label>
              <Input
                placeholder="Search by product or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border border-border/40 my-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleExpandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleCollapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No orders found matching the filter criteria.
          </div>
        ) : (
          filteredOrders.map((order: any) => {
            const isSeller = user?.id === order.farmer_id;
            const isExpanded = expandedOrders[order.id];
            return (
              <Card 
                key={order.id} 
                className={`${order.escrow_status === 'held' ? "border-blue-200" : ""} transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md`}
              >
                <div 
                  onClick={() => toggleExpand(order.id)} 
                  className="p-4 cursor-pointer hover:bg-muted/20 transition-colors select-none flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-foreground">{order.products?.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">
                        • {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {isSeller ? "Sale" : "Purchase"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isSeller ? `Buyer: ${order.buyer_id?.full_name}` : `Seller: ${order.farmer_id?.full_name}`}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap md:flex-nowrap">
                    <div className="flex items-center gap-4 text-xs font-medium mr-2">
                      <div>
                        <span className="text-muted-foreground">Qty: </span>
                        <span>{order.quantity} {order.products?.unit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="text-primary font-bold">
                          {order.currency === "KES" ? "KSh " : "$"}{order.total_price?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order)}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-4 border-t border-border/30 bg-card">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs block">Quantity</span>
                        <p className="font-semibold">{order.quantity} {order.products?.unit}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Total Price</span>
                        <p className="font-semibold text-primary">
                          {order.currency === "KES" ? "KSh " : "$"}{order.total_price?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Payment Type</span>
                        <p className="font-semibold uppercase text-xs">{order.payment_type?.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Order Date</span>
                        <p className="font-semibold">
                          {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                      <span className="text-xs text-muted-foreground font-semibold block uppercase">Delivery / Logistics Details</span>
                      <p className="text-sm mt-1">{order.delivery_address}</p>
                    </div>

                    {renderTimeline(order)}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleMessage(order)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message {isSeller ? "Buyer" : "Seller"}
                      </Button>

                      {/* Buyer Actions */}
                      {!isSeller && order.escrow_status === "awaiting_payment" && (
                        <Button size="sm" onClick={() => { setPaymentOrder(order); setIsPaymentModalOpen(true); setPaymentStep("input"); }} className="bg-amber-600 hover:bg-amber-700 font-bold">
                          <DollarSign className="mr-2 h-4 w-4" /> Pay Now
                        </Button>
                      )}

                      {!isSeller && order.escrow_status === "held" && (
                        <>
                          <Button size="sm" onClick={() => handleReleasePayment(order.id)} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                            <CheckCircle className="mr-2 h-4 w-4" /> Confirm Receipt & Pay
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setTargetDisputeOrder(order); setIsDisputeModalOpen(true); }}>
                            <AlertCircle className="mr-2 h-4 w-4" /> Report Issue
                          </Button>
                        </>
                      )}

                      {!isSeller && order.payment_type === "cash_on_delivery" && order.status === "dispatched" && (
                        <Button size="sm" onClick={() => handleReleasePayment(order.id)} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                          <CheckCircle className="mr-2 h-4 w-4" /> Confirm Delivery Received
                        </Button>
                      )}

                      {!isSeller && order.escrow_status === "released" && (
                        <Button size="sm" variant="secondary" onClick={() => { setReviewOrder(order); setIsReviewModalOpen(true); }}>
                          <Star className="mr-2 h-4 w-4 fill-current" /> Review Product
                        </Button>
                      )}
                    </div>

                    {/* Seller Actions */}
                    {isSeller && order.status === "pending" && (
                      <div className="flex gap-2 pt-2 border-t border-border/20">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, "accepted")}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accept Order
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateStatus(order.id, "cancelled")}
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {isSeller && order.status === "accepted" && (
                      <div className="w-full pt-2 border-t border-border/20">
                        {order.payment_type !== "cash_on_delivery" && order.escrow_status === "awaiting_payment" ? (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs text-center font-medium">
                            ⚠️ Order accepted. Waiting for the buyer to place funds in Escrow before shipping.
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, "dispatched")}
                            className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Dispatch Order / Mark as Shipped
                          </Button>
                        )}
                      </div>
                    )}

                    {isSeller && order.status === "dispatched" && (
                      <div className="w-full pt-2 border-t border-border/20">
                        {order.payment_type === "cash_on_delivery" ? (
                          <Button
                            size="sm"
                            onClick={() => handleReleasePayment(order.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm Cash Received & Completed
                          </Button>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-xs text-center font-medium">
                            🚚 Order in transit. Waiting for the buyer to confirm receipt and release escrow.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate the Product</DialogTitle>
            <DialogDescription>
              Your feedback helps the community choose high-quality items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={`h-8 w-8 cursor-pointer transition-colors ${i <= rating ? "text-yellow-500 fill-current" : "text-muted"}`}
                  onClick={() => setRating(i)}
                />
              ))}
            </div>
            <div className="space-y-2">
              <Label>Detailed Feedback</Label>
              <Textarea
                placeholder="How was the freshness and quality?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleSubmitReview}>Submit Review</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Gateway Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Secure Escrow Checkout
            </DialogTitle>
            <DialogDescription>
              Your payment will be held securely in escrow until you explicitly confirm delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-muted p-4 rounded-lg flex justify-between items-center text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-emerald-600">
                {paymentOrder?.currency === "KES" ? "KSh " : "$"}{paymentOrder?.total_price?.toLocaleString()}
              </span>
            </div>

            {paymentOrder?.payment_type === "mobile_money" && (
              <div className="space-y-4">
                {paymentStep === "input" ? (
                  <>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-medium">
                      📱 Pay securely via M-Pesa. You will receive an STK Push prompt on your Safaricom mobile phone to enter your PIN.
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-xs text-muted-foreground uppercase">Safaricom Mobile Number</Label>
                      <div className="flex gap-2">
                        <span className="h-10 border border-input rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground font-semibold flex items-center">
                          +254
                        </span>
                        <Input
                          placeholder="712345678"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value.replace(/\D/g, ''))}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Format: Enter 9 digits (e.g. 712345678 or 112345678)</p>
                    </div>
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-white font-bold" 
                      onClick={handlePayOrder}
                      disabled={isProcessingPayment}
                    >
                      Send M-Pesa STK Push
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-base">M-Pesa STK Prompt Sent</h4>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Please check your phone for the M-Pesa prompt requesting PIN entry for KSh {paymentOrder?.total_price?.toLocaleString()}.
                      </p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setPaymentStep("input"); setIsProcessingPayment(false); }}
                      >
                        Change Number
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handlePayOrder}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Confirm PIN Entered
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentOrder?.payment_type === "bank_transfer" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-sm text-blue-950">🏦 Wakulima Escrow Bank Details</p>
                  <p><strong>Bank:</strong> Equity Bank Kenya</p>
                  <p><strong>Account Name:</strong> Wakulima Online Escrow</p>
                  <p><strong>Account Number:</strong> 1210 1827 3645</p>
                  <p><strong>Paybill:</strong> 247247 | <strong>Account:</strong> ESC-{paymentOrder?.id?.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-xs text-muted-foreground uppercase">Bank Transaction Reference / Code</Label>
                  <Input 
                    placeholder="E.g. OB75XHJ89Z" 
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value.toUpperCase())}
                  />
                  <p className="text-[10px] text-muted-foreground">Input the transaction ref from your mobile banking app or bank slip.</p>
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold" 
                  onClick={handlePayOrder}
                  disabled={isProcessingPayment}
                >
                  Confirm Bank Deposit
                </Button>
              </div>
            )}

            {paymentOrder?.payment_type === "wallet" && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Balance:</span>
                    <span className="font-bold text-primary">KSh 45,500</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5">
                    <span className="text-muted-foreground">Payment Amount:</span>
                    <span className="font-bold text-emerald-600">KSh {paymentOrder?.total_price?.toLocaleString()}</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 h-11 font-bold" 
                  onClick={handlePayOrder}
                  disabled={isProcessingPayment}
                >
                  Pay from Wallet Balance
                </Button>
              </div>
            )}

            {(paymentOrder?.payment_type === "cash_on_delivery" || !paymentOrder?.payment_type) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cardholder Name</Label>
                  <Input defaultValue={user?.full_name || ""} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <div className="relative">
                    <Input placeholder="•••• •••• •••• ••••" className="pl-10" />
                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVC</Label>
                    <Input placeholder="•••" type="password" />
                  </div>
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 font-bold" 
                  onClick={handlePayOrder}
                  disabled={isProcessingPayment}
                >
                  Pay Securely via Card
                </Button>
              </div>
            )}

            <p className="text-[10px] text-center text-muted-foreground">
              All transactions are secured with military-grade SSL encryption. Funds are locked in smart escrow until delivery is finalized.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive"><AlertCircle className="mr-2 h-5 w-5" /> Report an Issue</DialogTitle>
            <DialogDescription>
              Is there a problem with your order? Your funds are safe in escrow. Let us know what happened so our admins can step in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dispute Reason</Label>
              <Textarea
                placeholder="E.g., The produce arrived spoiled, quantity was less than expected, etc."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm">
              <p><strong>Note:</strong> Filing a dispute will freeze the escrow funds. Do not file disputes frivolously.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDisputeModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDisputeOrder}>Submit Dispute</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No orders yet</p>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
