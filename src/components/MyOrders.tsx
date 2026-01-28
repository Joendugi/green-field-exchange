import { useEffect, useState } from "react";
import { account, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
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
    const user = await account.get().catch(() => null);
    if (!user) return;

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const queries = [];

    // Sort logic in Appwrite: Query.orderDesc("created_at")
    queries.push(Query.orderDesc("$createdAt"));

    if (userRole === "farmer") {
      queries.push(Query.equal("farmer_id", user.$id));
    } else {
      queries.push(Query.equal("buyer_id", user.$id));
    }

    const { documents: ordersData } = await databases.listDocuments(
      dbId,
      "orders",
      queries
    );

    // Manual joins
    let enrichedOrders = [...ordersData];

    // 1. Fetch Products
    const productIds = [...new Set(ordersData.map(o => o.product_id))];
    if (productIds.length > 0) {
      const productsData = await databases.listDocuments(
        dbId,
        "products",
        [Query.equal("$id", productIds)]
      );
      const productsMap = productsData.documents.reduce((acc: any, p: any) => ({ ...acc, [p.$id]: p }), {});
      enrichedOrders = enrichedOrders.map(o => ({ ...o, products: productsMap[o.product_id] }));
    }

    // 2. Fetch Profiles (Buyer & Farmer)
    const profileIds = [...new Set([
      ...ordersData.map(o => o.buyer_id),
      ...ordersData.map(o => o.farmer_id)
    ])];

    if (profileIds.length > 0) {
      const profilesData = await databases.listDocuments(
        dbId,
        "profiles",
        [Query.equal("$id", profileIds)]
      );
      const profilesMap = profilesData.documents.reduce((acc: any, p: any) => ({ ...acc, [p.$id]: p }), {});
      enrichedOrders = enrichedOrders.map(o => ({
        ...o,
        buyer: profilesMap[o.buyer_id],
        farmer: profilesMap[o.farmer_id]
      }));
    }

    setOrders(enrichedOrders);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      await databases.updateDocument(
        dbId,
        "orders",
        orderId,
        { status: newStatus }
      );

      const order = orders.find(o => o.$id === orderId);
      if (order) {
        await databases.createDocument(
          dbId,
          "notifications",
          ID.unique(),
          {
            user_id: order.buyer_id,
            type: "order",
            title: "Order Status Updated",
            message: `Your order status has been updated to: ${newStatus}`,
            link: "/dashboard?tab=orders",
          }
        );
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
          <Card key={order.$id}>
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
                    {new Date(order.$createdAt).toLocaleDateString()}
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
                    onClick={() => handleUpdateStatus(order.$id, "accepted")}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Order
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUpdateStatus(order.$id, "cancelled")}
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
                  onClick={() => handleUpdateStatus(order.$id, "completed")}
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
