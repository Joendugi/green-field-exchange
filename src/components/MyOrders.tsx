import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface MyOrdersProps {
  userRole: string | null;
}

const MyOrders = ({ userRole }: MyOrdersProps) => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let query = supabase
      .from("orders")
      .select(`
        *,
        products (name, unit),
        buyer:buyer_id (full_name),
        farmer:farmer_id (full_name)
      `)
      .order("created_at", { ascending: false });

    if (userRole === "farmer") {
      query = query.eq("farmer_id", session.user.id);
    } else {
      query = query.eq("buyer_id", session.user.id);
    }

    const { data } = await query;
    setOrders(data || []);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as any })
        .eq("id", orderId);

      if (error) throw error;

      const order = orders.find(o => o.id === orderId);
      if (order) {
        await supabase.from("notifications").insert({
          user_id: order.buyer_id,
          type: "order",
          title: "Order Status Updated",
          message: `Your order status has been updated to: ${newStatus}`,
          link: "/dashboard?tab=orders",
        });
      }

      toast.success("Order status updated!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "secondary",
      accepted: "default",
      completed: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">
        {userRole === "farmer" ? "Incoming Orders" : "My Orders"}
      </h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{order.products?.name}</CardTitle>
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
                  <p className="font-semibold">{order.quantity} {order.products?.unit}</p>
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
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Delivery Address:</span>
                <p className="text-sm">{order.delivery_address}</p>
              </div>

              {userRole === "farmer" && order.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(order.id, "accepted")}
                    className="flex-1"
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

              {userRole === "farmer" && order.status === "accepted" && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(order.id, "completed")}
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

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No orders yet</p>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
