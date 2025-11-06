import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Package, ShoppingCart, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchVerificationRequests();
  }, []);

  const fetchStats = async () => {
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: orderCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const { data: orders } = await supabase
      .from("orders")
      .select("total_price");

    const revenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_price.toString()), 0) || 0;

    setStats({
      users: userCount || 0,
      products: productCount || 0,
      orders: orderCount || 0,
      revenue,
    });
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles (role, is_verified)
      `)
      .order("created_at", { ascending: false });

    setUsers(data || []);
  };

  const fetchVerificationRequests = async () => {
    const { data } = await supabase
      .from("verification_requests")
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setVerificationRequests(data || []);
  };

  const handleVerifyUser = async (requestId: string, userId: string, approve: boolean) => {
    try {
      // Update verification request
      const { error: requestError } = await supabase
        .from("verification_requests")
        .update({
          status: approve ? "approved" : "rejected",
          admin_notes: approve ? "User verified" : "Verification rejected",
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      if (approve) {
        // Update user's verification status
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ is_verified: true })
          .eq("user_id", userId);

        if (roleError) throw roleError;
      }

      // Send notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "verification",
        title: approve ? "Verification Approved" : "Verification Rejected",
        message: approve
          ? "Congratulations! Your account has been verified."
          : "Your verification request has been rejected. Please contact support.",
      });

      toast.success(approve ? "User verified successfully!" : "Request rejected");
      fetchVerificationRequests();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="verification">
            Verification Requests
            {verificationRequests.length > 0 && (
              <Badge className="ml-2" variant="destructive">
                {verificationRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.location || "No location"}</p>
                      <div className="flex gap-2 mt-2">
                        {user.user_roles?.map((role: any, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {role.role} {role.is_verified && "✓"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Requests</CardTitle>
              <CardDescription>Review and approve user verifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verificationRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{request.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerifyUser(request.id, request.user_id, true)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleVerifyUser(request.id, request.user_id, false)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}

                {verificationRequests.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">No pending verification requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
