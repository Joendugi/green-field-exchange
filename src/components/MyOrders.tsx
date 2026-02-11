<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
=======
import { useEffect, useState } from "react";
import { account, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, CheckCircle, XCircle, MessageSquare, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MyOrdersProps {
  userRole: string | null;
}

const MyOrders = ({ userRole }: MyOrdersProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch = searchTerm
        ? [order.products?.name, order.buyer?.full_name, order.farmer?.full_name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const orderDate = new Date(order.created_at).toISOString().split("T")[0];
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
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="h-4 w-4" /> Order progress
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          {timelineSteps.map((step, index) => {
            const isActive = currentIndex >= index;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                    isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {index === 0
                      ? new Date(order.created_at).toLocaleString()
                      : order.updated_at
                        ? new Date(order.updated_at).toLocaleString()
                        : "Awaiting update"}
                  </p>
                </div>
              </div>
            );
          })}
          {order.status === "cancelled" && (
            <Badge variant="destructive">Cancelled</Badge>
          )}
        </div>
      </div>
    );
  };

  const handleMessage = (order: any) => {
    const recipient = userRole === "farmer" ? order.buyer?.full_name : order.farmer?.full_name;
    navigate("/social", {
      state: {
        prefill: {
          recipient,
          subject: `Regarding order #${order.id}`,
          body: `Hi ${recipient?.split(" ")[0] || "there"}, about ${order.products?.name}...`,
        },
      },
    });
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
<<<<<<< HEAD
        {filteredOrders.map((order) => (
          <Card key={order.id}>
=======
        {orders.map((order) => (
          <Card key={order.$id}>
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
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

<<<<<<< HEAD
              {renderTimeline(order)}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleMessage(order)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message {userRole === "farmer" ? "Buyer" : "Farmer"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${order.buyer?.phone || order.farmer?.phone || ""}`)}
                >
                  Call
                </Button>
              </div>
=======
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760

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
