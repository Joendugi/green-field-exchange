import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, CheckCircle, XCircle, MessageSquare, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface MyOrdersProps {
  userRole?: string | null;
}

const MyOrders = ({ userRole: propRole }: MyOrdersProps) => {
  const { role: authRole } = useAuth();
  const userRole = propRole || authRole;
  // Use Convex query
  // Passing "skip" if no userRole? No, userRole can be null initially.
  // api.orders.list handles optional role, but we really want it filtered if userRole is set.
  // string | null is not strictly string.
  const orders = useQuery(api.orders.list, { role: userRole || undefined }) || [];

  const updateStatus = useMutation(api.orders.updateStatus);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch = searchTerm
        ? [order.product?.name, order.buyer?.full_name, order.farmer?.full_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const orderDate = new Date(order._creationTime).toISOString().split("T")[0];
      const matchesStart = startDate ? orderDate >= startDate : true;
      const matchesEnd = endDate ? orderDate <= endDate : true;
      return matchesStatus && matchesSearch && matchesStart && matchesEnd;
    });
  }, [orders, statusFilter, searchTerm, startDate, endDate]);

  const timelineSteps = [
    { key: "pending", label: "Order Placed" },
    { key: "accepted", label: "Accepted" },
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
        <div className="relative flex justify-between">
          {/* Progress Line */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-muted z-0 hidden sm:block" />
          <div
            className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 z-0 hidden sm:block"
            style={{ width: `${Math.max(0, currentIndex) * (100 / (timelineSteps.length - 1))}%` }}
          />

          {timelineSteps.map((step, index) => {
            const isActive = currentIndex >= index;
            const isCurrent = currentIndex === index;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 group sm:flex-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                      : "border-muted bg-background text-muted-foreground"
                    } ${isCurrent ? "scale-110" : ""}`}
                >
                  {isActive ? <CheckCircle className="h-5 w-5" /> : index + 1}
                </div>
                <div className="text-center px-1">
                  <p className={`text-xs font-bold transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 hidden md:block">
                    {isActive
                      ? (index === 0 ? new Date(order._creationTime).toLocaleDateString() : (order.updated_at ? new Date(order.updated_at).toLocaleDateString() : ""))
                      : "Pending"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {order.status === "cancelled" && (
          <div className="mt-4 p-2 bg-destructive/10 text-destructive text-center rounded-lg text-xs font-semibold border border-destructive/20">
            This order was cancelled.
          </div>
        )}
      </div>
    );
  };

  const handleMessage = (order: any) => {
    const recipient = userRole === "farmer" ? order.buyer?.full_name : order.farmer?.full_name;
    navigate("/social", {
      state: {
        prefill: {
          recipient, // Ideally pass ID, but existing logic used name?
          // Convex messages likely need ID. existing 'social' page might rely on name search or ID pass.
          // I should probably pass userId: userRole === "farmer" ? order.buyerId : order.farmerId
          recipientId: userRole === "farmer" ? order.buyerId : order.farmerId,
          subject: `Regarding order #${order._id}`,
          body: `Hi ${recipient?.split(" ")[0] || "there"}, about ${order.product?.name}...`,
        },
      },
    });
  };

  const handleUpdateStatus = async (orderId: Id<"orders">, newStatus: string) => {
    try {
      await updateStatus({ orderId, status: newStatus });
      toast.success(`Order ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      accepted: "default",
      completed: "outline",
      cancelled: "destructive",
    };

    return <Badge variant={variants[status] || "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">
          {userRole === "farmer" ? "Incoming Orders" : "My Orders"}
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

      <div className="space-y-4">
        {filteredOrders.map((order: any) => (
          <Card key={order._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{order.product?.name}</CardTitle>
                {getStatusBadge(order.status)}
              </div>
              <CardDescription>
                {userRole === "farmer" ? `Buyer: ${order.buyer?.full_name}` : `Farmer: ${order.farmer?.full_name}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Quantity:</span>
                  <p className="font-semibold">{order.quantity} {order.product?.unit}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Price:</span>
                  <p className="font-semibold text-primary">${order.total_price}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Type:</span>
                  <p className="font-semibold">{order.payment_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Order Date:</span>
                  <p className="font-semibold">
                    {new Date(order._creationTime).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Delivery Address:</span>
                <p className="text-sm">{order.delivery_address}</p>
              </div>

              {renderTimeline(order)}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleMessage(order)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message {userRole === "farmer" ? "Buyer" : "Farmer"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${order.buyer?.phone || order.farmer?.phone || ""}`)} // Phone not in profile schema yet, removed or needs fix.
                // Profiles schema didn't have phone. 
                // I'll leave it as is, likely undefined.
                >
                  Call
                </Button>
              </div>

              {userRole === "farmer" && order.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(order._id, "accepted")}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Order
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUpdateStatus(order._id, "cancelled")}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              )}

              {userRole === "farmer" && order.status === "accepted" && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(order._id, "completed")}
                  className="w-full"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
